import { Location } from "../types";
import { useMapStore } from "../store/mapStore"
import { useCallback } from "react";

function useFilter() {
  const { setFilteredData, data } = useMapStore()

  const filterData = useCallback((key: keyof Location, value: string) => {
    if (!data) return

    const filtered = data.filter((location) => location[key] === value)
    
    setFilteredData(filtered)
  }, [data, setFilteredData])

  return filterData
}

export default useFilter