import InteractiveMap from '../components/InteractiveMap'
import InfoPanel from '../components/InfoPanel'
import InfoPanelVertical from '../components/InfoPanelVertical'
import './MapPage.css'
import Share from '../components/Share'

export default function MapPage() {
  return (
    <div className="map-page">
      <InteractiveMap />
      <InfoPanel />
      <InfoPanelVertical />
      <Share />
    </div>
  )
}