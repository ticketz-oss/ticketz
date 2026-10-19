import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";
import { groupPostsByConnection, upsertPost } from "./storyState";

// The strip stays hidden until the server confirms the tenant has Status
// turned on, in the same way AgentAvailability gates the agent launcher.
const useWhatsappStatus = companyId => {
  const socketManager = useContext(SocketContext);
  const [availability, setAvailability] = useState({
    companyId: null,
    enabled: false
  });
  const [connections, setConnections] = useState([]);
  const [posts, setPosts] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const availabilityRequest = useRef(0);
  const dataRequest = useRef(0);
  const reloadWhenEnabled = useRef(() => {});

  const enabled =
    Boolean(companyId) &&
    availability.companyId === companyId &&
    availability.enabled;

  const checkAvailability = useCallback(async () => {
    const requestId = ++availabilityRequest.current;
    try {
      const { data } = await api.get("/whatsapp-status/availability");
      if (requestId === availabilityRequest.current)
        setAvailability({ companyId, enabled: data?.enabled === true });
    } catch (_) {
      if (requestId === availabilityRequest.current)
        setAvailability({ companyId, enabled: false });
    }
  }, [companyId]);

  const reload = useCallback(async () => {
    const requestId = ++dataRequest.current;
    try {
      const [connectionsResponse, postsResponse] = await Promise.all([
        api.get("/whatsapp-status/connections"),
        api.get("/whatsapp-status/posts", { params: { active: true } })
      ]);
      if (requestId !== dataRequest.current) return;
      setConnections(
        Array.isArray(connectionsResponse.data) ? connectionsResponse.data : []
      );
      setPosts(Array.isArray(postsResponse.data) ? postsResponse.data : []);
      setNow(Date.now());
    } catch (_) {
      // Keep what is on screen during a transient failure.
    }
  }, []);

  useEffect(() => {
    availabilityRequest.current += 1;
    setAvailability({ companyId, enabled: false });
    if (!companyId) return undefined;
    checkAvailability();
    window.addEventListener("focus", checkAvailability);
    return () => {
      availabilityRequest.current += 1;
      window.removeEventListener("focus", checkAvailability);
    };
  }, [companyId, checkAvailability]);

  useEffect(() => {
    if (!enabled) {
      dataRequest.current += 1;
      setConnections([]);
      setPosts([]);
      return undefined;
    }
    reload();
    reloadWhenEnabled.current = reload;
    // Expired stories leave the strip without waiting for a reload.
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      reloadWhenEnabled.current = () => {};
      clearInterval(timer);
    };
  }, [enabled, reload]);

  useEffect(() => {
    if (!companyId || !socketManager?.GetSocket) return undefined;
    const socket = socketManager.GetSocket(companyId);
    if (!socket) return undefined;
    const onPost = data => {
      if (!data?.post) return;
      setNow(Date.now());
      setPosts(current =>
        data.action === "delete"
          ? current.filter(post => post.id !== data.post.id)
          : upsertPost(current, data.post)
      );
    };
    const onAvailability = data =>
      setAvailability({ companyId, enabled: data?.enabled === true });
    const onRefresh = refreshRequired => {
      if (!refreshRequired) return;
      checkAvailability();
      reloadWhenEnabled.current();
    };

    socket.on(`company-${companyId}-whatsapp-status-post`, onPost);
    socket.on(
      `company-${companyId}-whatsapp-status-availability`,
      onAvailability
    );
    socket.on("wsRefreshRequired", onRefresh);
    return () => socket.disconnect();
  }, [companyId, socketManager, checkAvailability]);

  const applyPost = useCallback(post => {
    if (!post) return;
    setNow(Date.now());
    setPosts(current => upsertPost(current, post));
  }, []);

  const postsByConnection = useMemo(
    () => groupPostsByConnection(posts, now),
    [posts, now]
  );

  return { enabled, connections, postsByConnection, reload, applyPost };
};

export default useWhatsappStatus;
