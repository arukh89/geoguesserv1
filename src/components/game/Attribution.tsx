import React from "react"

export function Attribution({ provider }: { provider?: 'mapillary'|'kartaview' }) {
  return (
    <div className="text-[10px] text-neutral-500">
      {provider === 'mapillary' && 'Imagery © Mapillary contributors'}
      {provider === 'kartaview' && 'Imagery © KartaView (CC BY-SA 4.0) & contributors'}
      <span className="ml-2">© OpenStreetMap contributors</span>
    </div>
  );
}
