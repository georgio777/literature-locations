import InteractiveMap from '../components/InteractiveMap'
import InfoPanel from '../components/InfoPanel'
import InfoPanelVertical from '../components/InfoPanelVertical'
import './MapPage.css'

export default function MapPage() {
  return (
    <div className="map-page">
      <InteractiveMap />
      <InfoPanel />
      <InfoPanelVertical />
    </div>
  )
}