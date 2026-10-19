#!/bin/sh
set -eu

# O config.json e o ambiente do container entregue ao navegador. Gerar o JSON
# com printf cru quebrava o arquivo inteiro sempre que algum valor tinha aspas
# ou quebra de linha: o Railway injeta RAILWAY_GIT_COMMIT_MESSAGE, e uma
# mensagem de commit de varios paragrafos derrubou a aplicacao com
# "Config not found". Aqui cada valor e escapado e as continuacoes de valores
# multilinha voltam para a chave a que pertencem.
env | awk '
  function esc(s,   i, c, out) {
    out = ""
    for (i = 1; i <= length(s); i++) {
      c = substr(s, i, 1)
      if (c == "\\") out = out "\\\\"
      else if (c == "\"") out = out "\\\""
      else if (c == "\n") out = out "\\n"
      else if (c == "\t") out = out "\\t"
      else if (c == "\r") out = out "\\r"
      else out = out c
    }
    return out
  }
  /^[A-Za-z_][A-Za-z0-9_]*=/ {
    eq = index($0, "=")
    n++
    keys[n] = substr($0, 1, eq - 1)
    vals[n] = substr($0, eq + 1)
    next
  }
  # Linha que nao comeca com "NOME=" e continuacao do valor anterior.
  n > 0 { vals[n] = vals[n] "\n" $0 }
  END {
    print "{"
    for (i = 1; i <= n; i++)
      printf "\t\"%s\": \"%s\"%s\n", keys[i], esc(vals[i]), (i < n ? "," : "")
    print "}"
  }
' > /var/www/public/config.json

RESOLVERS="$(awk '/^nameserver/{ ip=$2; if (index(ip, ":")) printf "[%s] ", ip; else printf "%s ", ip }' /etc/resolv.conf)"
[ -n "$RESOLVERS" ] || RESOLVERS="127.0.0.11"
BACKEND_UPSTREAM="${BACKEND_SERVICE:-backend}:3000"

printf 'resolver %s valid=10s ipv6=on;\nmap $host $backend_upstream {\n    default "%s";\n}\n' \
  "$RESOLVERS" "$BACKEND_UPSTREAM" > /etc/nginx/conf.d/00-upstream.conf

exec nginx -g "daemon off;"
