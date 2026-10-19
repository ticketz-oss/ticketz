#!/usr/bin/env python3
"""Private Windows loopback bridge to the installed Hermes conversation runtime.

It does not enable the Hermes gateway API or alter Hermes configuration. The
Ticketz backend supplies authenticated tenant/user ids and conversation history.
Provider credentials stay in this process and never appear in HTTP responses.
"""

from __future__ import annotations

import hashlib
import hmac
import ipaddress
import json
import os
import re
import sys
import subprocess
import threading
import time
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


MAX_BODY_BYTES = 256 * 1024
MAX_MESSAGES = 40
MAX_CONTENT_CHARS = 8_000
MAX_TOTAL_CHARS = 50_000
IDENTIFIER = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


class BridgeError(Exception):
    def __init__(self, code: str, status: int = 400):
        super().__init__(code)
        self.code = code
        self.status = status


@dataclass(frozen=True)
class ChatRequest:
    company_id: str
    user_id: str
    conversation_id: str
    messages: tuple[dict[str, str], ...]
    context: dict
    tool_access: dict

    @property
    def session_id(self) -> str:
        scope = f"{self.company_id}:{self.user_id}:{self.conversation_id}"
        return "espaco-whats-" + hashlib.sha256(scope.encode("utf-8")).hexdigest()[:32]


def validate_chat_payload(body: Any) -> ChatRequest:
    if not isinstance(body, dict):
        raise BridgeError("INVALID_CHAT_PAYLOAD")
    identifiers = []
    for field in ("companyId", "userId", "conversationId"):
        raw = body.get(field)
        if isinstance(raw, bool) or not isinstance(raw, (str, int)):
            raise BridgeError("INVALID_CHAT_SCOPE")
        value = str(raw)
        if not IDENTIFIER.fullmatch(value):
            raise BridgeError("INVALID_CHAT_SCOPE")
        identifiers.append(value)
    messages = body.get("messages")
    if not isinstance(messages, list) or not 1 <= len(messages) <= MAX_MESSAGES:
        raise BridgeError("INVALID_CHAT_MESSAGES")
    normalized = []
    for message in messages:
        if not isinstance(message, dict):
            raise BridgeError("INVALID_CHAT_MESSAGES")
        role, content = message.get("role"), message.get("content")
        if role not in ("user", "assistant") or not isinstance(content, str):
            raise BridgeError("INVALID_CHAT_MESSAGES")
        role_limit = MAX_CONTENT_CHARS if role == "user" else 12_000
        if not content.strip() or len(content) > role_limit:
            raise BridgeError("INVALID_CHAT_MESSAGES")
        normalized.append({"role": role, "content": content})
    if normalized[-1]["role"] != "user":
        raise BridgeError("LAST_CHAT_MESSAGE_MUST_BE_USER")
    if sum(len(message["content"]) for message in normalized) > MAX_TOTAL_CHARS:
        raise BridgeError("CHAT_CONTEXT_TOO_LARGE", 413)
    context = body.get("context")
    access = body.get("toolAccess")
    if not isinstance(context, dict) or not isinstance(access, dict):
        raise BridgeError("INVALID_CHAT_CONTEXT")
    return ChatRequest(*identifiers, tuple(normalized), context, access)


def has_valid_auth(header: str, key: str) -> bool:
    expected = ("Bearer " + key).encode("utf-8")
    return hmac.compare_digest(header.encode("utf-8"), expected)



class HermesRuntime:
    def __init__(self, source_home: Path, repository: Path):
        self.source_home = source_home
        self.repository = repository
        self._ready = False
        self._lock = threading.Lock()
        self._slots = threading.BoundedSemaphore(4)
        self._active = 0
        self._stage = "idle"
        self._stage_started = time.monotonic()
        self._last_error_type = None

    def _mark_stage(self, stage: str) -> None:
        self._stage = stage
        self._stage_started = time.monotonic()

    def initialize(self) -> None:
        with self._lock:
            if self._ready:
                return
            if not (self.repository / "run_agent.py").is_file():
                raise BridgeError("HERMES_RUNTIME_NOT_FOUND", 503)
            if not Path(__file__).with_name("hermes-context-worker.py").is_file():
                raise BridgeError("HERMES_RUNTIME_NOT_FOUND", 503)
            # No conversation/plugin runtime is imported into this shared
            # process. Each worker resolves provider credentials and imports
            # AIAgent only after selecting its disposable private home.
            self._ready = True
            self._mark_stage("idle")

    def health(self) -> dict[str, Any]:
        self.initialize()
        return {
            "ok": True,
            "service": "hermes-chat-bridge",
            "runtimeReady": True,
            "readOnly": True,
            "isolatedWorkers": True,
            "tools": 6,
            "stage": self._stage,
            "stageElapsedSeconds": round(time.monotonic() - self._stage_started, 2),
            "busy": self._active > 0,
            "activeRequests": self._active,
            "lastErrorType": self._last_error_type,
        }

    def reply(self, request: ChatRequest) -> dict[str, Any]:
        if not self._slots.acquire(blocking=False):
            raise BridgeError("HERMES_CHAT_BUSY", 429)
        with self._lock:
            self._active += 1
        try:
            self.initialize()
            payload = {
                "companyId": request.company_id, "userId": request.user_id,
                "sessionId": request.session_id, "messages": list(request.messages),
                "context": request.context, "toolAccess": request.tool_access,
                "sourceHome": str(self.source_home), "repository": str(self.repository),
            }
            self._mark_stage("generate")
            result = subprocess.run(
                [sys.executable, "-I", "-X", "utf8", str(Path(__file__).with_name("hermes-context-worker.py"))],
                input=json.dumps(payload), capture_output=True, text=True, encoding="utf-8",
                timeout=140, check=False,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            if result.returncode != 0:
                raise BridgeError("HERMES_CHAT_GENERATION_FAILED", 502)
            response = json.loads(result.stdout)
            if not isinstance(response, dict):
                raise BridgeError("HERMES_CHAT_GENERATION_FAILED", 502)
            if response.get("error"):
                known_errors = {"HERMES_CHAT_INVALID_TOOLS_ENDPOINT", "HERMES_CHAT_INVALID_TOOL_ALLOWLIST", "HERMES_CHAT_ISOLATION_FAILED"}
                error = response["error"] if response["error"] in known_errors else "HERMES_CHAT_GENERATION_FAILED"
                raise BridgeError(error, 502)
            if not isinstance(response.get("reply"), str) or not response["reply"].strip() or len(response["reply"]) > 12_000 or not isinstance(response.get("citations"), list) or not isinstance(response.get("usesTenantData"), bool):
                raise BridgeError("HERMES_CHAT_GENERATION_FAILED", 502)
            return response
        except subprocess.TimeoutExpired:
            self._last_error_type = "TimeoutExpired"
            raise BridgeError("HERMES_CHAT_TIMEOUT", 504) from None
        except BridgeError as error:
            self._last_error_type = error.code
            raise
        except Exception:
            self._last_error_type = "WorkerUnavailable"
            raise BridgeError("HERMES_CHAT_UNAVAILABLE", 503) from None
        finally:
            with self._lock:
                self._active -= 1
                self._mark_stage("generate" if self._active else "idle")
            self._slots.release()


def make_handler(runtime: HermesRuntime, key: str):
    class ChatHandler(BaseHTTPRequestHandler):
        server_version = "EspacoWhatsHermesBridge/1"

        def log_message(self, format: str, *args: Any) -> None:
            # No request URL/header/body/provider diagnostics in shared logs.
            pass

        def setup(self) -> None:
            super().setup()
            self.connection.settimeout(10)

        def json_response(self, status: int, payload: dict[str, Any]) -> None:
            encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            try:
                self.wfile.write(encoded)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def authorize(self) -> bool:
            if not has_valid_auth(self.headers.get("Authorization", ""), key):
                self.json_response(401, {"error": "HERMES_CHAT_UNAUTHORIZED"})
                return False
            return True

        def do_GET(self) -> None:
            if not self.authorize():
                return
            if self.path != "/health":
                self.json_response(404, {"error": "NOT_FOUND"})
                return
            try:
                self.json_response(200, runtime.health())
            except Exception:
                self.json_response(503, {"error": "HERMES_RUNTIME_NOT_READY"})

        def do_POST(self) -> None:
            if not self.authorize():
                return
            if self.path != "/chat":
                self.json_response(404, {"error": "NOT_FOUND"})
                return
            try:
                if self.headers.get_content_type() != "application/json":
                    raise BridgeError("JSON_CONTENT_TYPE_REQUIRED", 415)
                if self.headers.get("Transfer-Encoding"):
                    raise BridgeError("TRANSFER_ENCODING_NOT_SUPPORTED", 400)
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                except ValueError:
                    raise BridgeError("INVALID_CONTENT_LENGTH") from None
                if not 0 < length <= MAX_BODY_BYTES:
                    raise BridgeError("CHAT_PAYLOAD_TOO_LARGE", 413)
                raw = self.rfile.read(length)
                if len(raw) != length:
                    raise BridgeError("INCOMPLETE_CHAT_PAYLOAD")
                try:
                    body = json.loads(raw.decode("utf-8"))
                except (ValueError, UnicodeDecodeError):
                    raise BridgeError("INVALID_JSON") from None
                reply = runtime.reply(validate_chat_payload(body))
                self.json_response(200, reply)
            except BridgeError as error:
                self.json_response(error.status, {"error": error.code})
            except Exception:
                self.json_response(503, {"error": "HERMES_CHAT_UNAVAILABLE"})

    return ChatHandler


def main() -> None:
    key = os.environ.get("HERMES_CHAT_BRIDGE_KEY", "")
    if len(key) < 32:
        raise SystemExit("HERMES_CHAT_BRIDGE_KEY must contain at least 32 characters.")
    host = os.environ.get("HERMES_CHAT_BRIDGE_HOST", "127.0.0.1")
    try:
        if not ipaddress.ip_address(host).is_loopback:
            raise ValueError
        port = int(os.environ.get("HERMES_CHAT_BRIDGE_PORT", "8643"))
        if not 1 <= port <= 65535:
            raise ValueError
    except ValueError:
        raise SystemExit("Bridge must bind to a loopback address and a valid port.") from None
    default_home = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "hermes"
    home = Path(
        os.environ.get("HERMES_CHAT_HOME")
        or os.environ.get("HERMES_HOME")
        or str(default_home)
    )
    repository = Path(os.environ.get("HERMES_CHAT_BRIDGE_REPO", str(home / "hermes-agent")))
    runtime = HermesRuntime(home, repository)
    server = ThreadingHTTPServer((host, port), make_handler(runtime, key))
    server.daemon_threads = True
    print(f"Espaco Whats Hermes chat bridge listening on {host}:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
