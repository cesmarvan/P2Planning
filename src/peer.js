// Utility to get/generate a stable peer id stored in localStorage
export default function getPeerId() {
  const key = 'p2p_peer_id';
  let id = localStorage.getItem(key);
  if (id) return id;
  // Generate a stable-ish id and persist it
  id = `peer-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  localStorage.setItem(key, id);
  return id;
}
