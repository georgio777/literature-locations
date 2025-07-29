import { useMemo } from "react";
import { useMapStore } from '../store/mapStore';
import { Marker } from "react-map-gl/maplibre";
import { useSearchParams } from "react-router-dom";

export default function Pins() {
  const { data, filteredData, currentId, setCurrentCharacter, setCurrentId } = useMapStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Определяем, какой массив использовать для отрисовки
  const charactersToRender = useMemo(() => {
    if (filteredData && filteredData.length > 0) {
      return filteredData;
    }
    
    // Если filteredData пуст - используем data
    return data || [];
  }, [data, filteredData]);


  return (
    <>
      {charactersToRender.map((character) => (
        <Marker
          key={character.id}
          longitude={Number(character.longitude)}
          latitude={Number(character.latitude)}
          anchor="center"
          onClick={() => {
            setCurrentCharacter(character);
            setSearchParams({ id: String(character.id) });
            setCurrentId(character.id);
          }}
        >
          <div
            style={{
              backgroundColor: currentId === character.id ? 'rgba(247, 246, 243, 1)' : '#012030'
            }}
            title={character.name}
            className="map-pin"
          >
            <span
              style={{
                color: currentId === character.id ? '#012030' : 'rgba(236, 243, 233, 1)'
              }}
              className="pin-name"
            >
              {Array.from(character.name)[0]}
            </span>
          </div>
        </Marker>
      ))}
    </>
  );
}