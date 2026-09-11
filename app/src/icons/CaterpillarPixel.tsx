const INNER = `<rect x="4" y="2" width="1" height="1" fill="#4a3a55"/><rect x="12" y="2" width="1" height="1" fill="#4a3a55"/><rect x="5" y="1" width="7" height="1" fill="#4a3a55"/><rect x="3" y="3" width="1" height="1" fill="#4a3a55"/><rect x="13" y="3" width="1" height="1" fill="#4a3a55"/><rect x="4" y="2" width="1" height="1" fill="#4a3a55"/><rect x="12" y="2" width="1" height="1" fill="#4a3a55"/><rect x="2" y="4" width="1" height="1" fill="#4a3a55"/><rect x="14" y="4" width="1" height="1" fill="#4a3a55"/><rect x="3" y="3" width="1" height="1" fill="#4a3a55"/><rect x="13" y="3" width="1" height="1" fill="#4a3a55"/><rect x="2" y="5" width="1" height="1" fill="#4a3a55"/><rect x="14" y="5" width="1" height="1" fill="#4a3a55"/><rect x="2" y="6" width="1" height="1" fill="#4a3a55"/><rect x="14" y="6" width="1" height="1" fill="#4a3a55"/><rect x="3" y="7" width="1" height="1" fill="#4a3a55"/><rect x="13" y="7" width="1" height="1" fill="#4a3a55"/><rect x="3" y="7" width="1" height="1" fill="#4a3a55"/><rect x="13" y="7" width="1" height="1" fill="#4a3a55"/><rect x="4" y="8" width="9" height="1" fill="#4a3a55"/><rect x="4" y="9" width="1" height="1" fill="#4a3a55"/><rect x="18" y="9" width="1" height="1" fill="#4a3a55"/><rect x="5" y="8" width="13" height="1" fill="#4a3a55"/><rect x="3" y="10" width="1" height="1" fill="#4a3a55"/><rect x="20" y="10" width="1" height="1" fill="#4a3a55"/><rect x="4" y="9" width="1" height="1" fill="#4a3a55"/><rect x="18" y="9" width="2" height="1" fill="#4a3a55"/><rect x="4" y="11" width="1" height="1" fill="#4a3a55"/><rect x="4" y="11" width="1" height="1" fill="#4a3a55"/><rect x="20" y="11" width="1" height="1" fill="#4a3a55"/><rect x="5" y="12" width="2" height="1" fill="#4a3a55"/><rect x="18" y="12" width="2" height="1" fill="#4a3a55"/><rect x="6" y="12" width="1" height="1" fill="#4a3a55"/><rect x="18" y="12" width="1" height="1" fill="#4a3a55"/><rect x="7" y="13" width="11" height="1" fill="#4a3a55"/><rect x="5" y="2" width="7" height="1" fill="#F7B9CE"/><rect x="4" y="3" width="9" height="1" fill="#F7B9CE"/><rect x="3" y="4" width="11" height="1" fill="#F7B9CE"/><rect x="3" y="5" width="11" height="1" fill="#F7B9CE"/><rect x="3" y="6" width="11" height="1" fill="#F7B9CE"/><rect x="4" y="7" width="9" height="1" fill="#F7B9CE"/><rect x="5" y="9" width="13" height="1" fill="#F7B9CE"/><rect x="4" y="10" width="16" height="1" fill="#F7B9CE"/><rect x="5" y="11" width="15" height="1" fill="#F7B9CE"/><rect x="7" y="12" width="11" height="1" fill="#F7B9CE"/>
<rect x="4" y="3" width="5" height="1" fill="#FAD2E0"/><rect x="4" y="4" width="2" height="1" fill="#FAD2E0"/>
<rect x="10" y="10" width="1" height="2" fill="#EFA0BE"/><rect x="14" y="10" width="1" height="2" fill="#EFA0BE"/><rect x="18" y="11" width="1" height="1" fill="#EFA0BE"/>
<rect x="3" y="4" width="3" height="3" fill="#F2F8FF"/><rect x="8" y="4" width="3" height="3" fill="#F2F8FF"/>
<rect x="2" y="4" width="1" height="3" fill="#A9BBE0"/><rect x="6" y="4" width="1" height="3" fill="#A9BBE0"/><rect x="7" y="4" width="1" height="3" fill="#A9BBE0"/><rect x="11" y="4" width="1" height="3" fill="#A9BBE0"/>
<rect x="3" y="3" width="3" height="1" fill="#A9BBE0"/><rect x="8" y="3" width="3" height="1" fill="#A9BBE0"/><rect x="3" y="7" width="3" height="1" fill="#A9BBE0"/><rect x="8" y="7" width="3" height="1" fill="#A9BBE0"/>
<rect x="4" y="5" width="1" height="1" fill="#2a2436"/><rect x="9" y="5" width="1" height="1" fill="#2a2436"/>
<rect x="2" y="6" width="1" height="1" fill="#F5789E"/><rect x="11" y="6" width="1" height="1" fill="#F5789E"/>
<rect x="6" y="7" width="2" height="1" fill="#2a2436"/>
<rect x="15" y="7" width="7" height="1" fill="#4a3a55"/><rect x="15" y="12" width="7" height="1" fill="#4a3a55"/><rect x="14" y="8" width="1" height="4" fill="#4a3a55"/><rect x="22" y="8" width="1" height="4" fill="#4a3a55"/>
<rect x="15" y="8" width="7" height="4" fill="#8B3A4A"/><rect x="17" y="8" width="3" height="4" fill="#F7E7D6"/><rect x="18" y="8" width="1" height="4" fill="#4a3a55"/>`;

export function CaterpillarPixel({ width = 104, height = 64 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 26 16"
      shapeRendering="crispEdges"
      style={{ flex: 'none' }}
      dangerouslySetInnerHTML={{ __html: INNER }}
    />
  );
}
