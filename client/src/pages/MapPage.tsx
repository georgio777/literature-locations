import InteractiveMap from '../components/InteractiveMap'
import InfoPanel from '../components/InfoPanel'
import InfoPanelVertical from '../components/InfoPanelVertical'
import './MapPage.css'
import Share from '../components/Share'
import Filter from '../components/Filter'

export default function MapPage() {
  return (
    <div className="map-page">
      <InteractiveMap />
      <InfoPanel />
      <InfoPanelVertical />
      <Share />
      <Filter />
    </div>
  )
}