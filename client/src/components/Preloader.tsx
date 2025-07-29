import './Preloader.css'
import logo from '../../logo.svg'

export default function Preloader() {
  return (
    <div className="preloader-wrapper">
      <img className='preloader-logo' src={logo} alt="logo" />
      <div className="typewriter">
        <h1>Литературные локации</h1>
      </div>
    </div>
  )
}