import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { Business } from '@/types';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with React
const createBusinessIcon = () => new DivIcon({
  className: 'custom-marker',
  html: `<div style="
    background: linear-gradient(135deg, hsl(340 75% 55%), hsl(330 85% 60%));
    width: 36px;
    height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  ">
    <span style="transform: rotate(45deg); font-size: 14px;">💇</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const createUserIcon = () => new DivIcon({
  className: 'user-marker',
  html: `<div style="
    background: hsl(0 0% 8%);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  ">
    <div style="width: 8px; height: 8px; background: hsl(340 75% 55%); border-radius: 50%;"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface RecenterButtonProps {
  userLocation: { lat: number; lng: number };
}

const RecenterButton = ({ userLocation }: RecenterButtonProps) => {
  const map = useMap();

  const handleRecenter = () => {
    map.setView([userLocation.lat, userLocation.lng], 13);
  };

  return (
    <Button
      onClick={handleRecenter}
      size="sm"
      className="absolute bottom-20 right-4 z-[1000] bg-card shadow-lg hover:bg-card/90"
      variant="outline"
    >
      <Navigation className="w-4 h-4 mr-2" />
      Recenter
    </Button>
  );
};

interface BusinessMapCardProps {
  business: Business;
  onViewProfile: () => void;
}

const BusinessMapCard = ({ business, onViewProfile }: BusinessMapCardProps) => (
  <div className="w-56 p-3">
    <div className="flex items-center gap-3 mb-2">
      <Avatar className="w-10 h-10">
        <AvatarImage src={business.profilePhotoUrl} alt={business.name} />
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          {business.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate text-foreground">{business.name}</h3>
        <p className="text-xs text-muted-foreground capitalize">
          {business.categories[0]?.replace('_', ' ')}
        </p>
      </div>
    </div>
    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
      <span>⭐ {business.rating} ({business.reviewCount})</span>
      {(business as any).distance !== undefined && (
        <span className="text-primary">{((business as any).distance as number).toFixed(1)} mi</span>
      )}
    </div>
    <Button 
      size="sm" 
      onClick={onViewProfile}
      className="w-full bg-gradient-primary hover:opacity-90"
    >
      View Profile
    </Button>
  </div>
);

interface BusinessMapProps {
  businesses: Business[];
  userLocation: { lat: number; lng: number } | null;
  onBusinessSelect: (business: Business) => void;
  className?: string;
}

export const BusinessMap = ({ 
  businesses, 
  userLocation, 
  onBusinessSelect,
  className = ''
}: BusinessMapProps) => {
  const defaultCenter = userLocation || { lat: 34.0522, lng: -118.2437 }; // LA default

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={12}
        className="w-full h-full rounded-xl"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon()}>
            <Popup>
              <span className="text-sm font-medium">Your location</span>
            </Popup>
          </Marker>
        )}
        
        {/* Business markers */}
        {businesses.map(business => (
          <Marker
            key={business.id}
            position={[business.location.lat, business.location.lng]}
            icon={createBusinessIcon()}
          >
            <Popup>
              <BusinessMapCard 
                business={business} 
                onViewProfile={() => onBusinessSelect(business)}
              />
            </Popup>
          </Marker>
        ))}
        
        {userLocation && <RecenterButton userLocation={userLocation} />}
      </MapContainer>
    </div>
  );
};
