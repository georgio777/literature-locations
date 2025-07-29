import './Filter.css'
import { useMapStore } from '../store/mapStore'
import { useEffect, useRef, useState } from 'react'
import useClickOutside from '../hooks/useClickOutside'
import useFilter from '../hooks/useFilter'

export default function Filter() {
  const { data, clearFiltered } = useMapStore()
  const [ authorsVisibility, setAuthorsVisibility] = useState(false)
  const [ fictionVisibility, setFictionVisibility] = useState(false)
  const [ uniqueAuthors, setUniqueAuthors] = useState< string[] | null>(null)
  const [ uniqueFictions, setUniqueFictions] = useState< string[] | null>(null)
  const filterElRef = useRef<HTMLDivElement>(null)
  const filter = useFilter()

  useClickOutside(filterElRef, () => {
    setAuthorsVisibility(false)
    setFictionVisibility(false)
  });

  useEffect(() => {
    // Если authorsVisibility стал true, fictionVisibility должен стать false
    if (authorsVisibility) {
      setFictionVisibility(false);
    }
  }, [authorsVisibility]);

  useEffect(() => {
    // Если fictionVisibility стал true, authorsVisibility должен стать false
    if (fictionVisibility) {
      setAuthorsVisibility(false);
    }
  }, [fictionVisibility]);


  useEffect(() => {
    if (!data) return

    const uniqAuthors = [...new Set(data.map(character => character.author))];
    setUniqueAuthors(uniqAuthors)

    const uniqFictions = [...new Set(data.map(character => character.fiction))];
    setUniqueFictions(uniqFictions)
  }, [data])

  return (
    <div 
    ref={filterElRef}
    className="filter-wrapper">
      <span className="filter-header">Фильтрация:</span>
      <div className="single-filter-wrapper">
        <button 
        onClick={() => setAuthorsVisibility((prev) => !prev)}
        className="filter-button">Автор</button>
        <ul 
        style={{ display: `${authorsVisibility? 'block' : 'none'}`}}
        className="single-filter-list">
          { uniqueAuthors?.map((author) => (
            <li 
            key={author}
            className="single-filter-element">
              <button
              onClick={() => filter( 'author', author )}
              className="single-filterr-button">{ author }</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="single-filter-wrapper">
        <button 
        onClick={() => setFictionVisibility((prev) => !prev)}
        className="filter-button">Произведение</button>
        <ul 
        style={{ display: `${fictionVisibility? 'block' : 'none'}`}}
        className="single-filter-list">
          { uniqueFictions?.map((fiction) => (
            <li 
            key={fiction}
            className="single-filter-element">
              <button
              onClick={() => filter( 'fiction', fiction )}
              className="single-filterr-button">{ fiction }</button>
            </li>
          ))}
        </ul>
      </div>
      <button 
      onClick={() => clearFiltered()}
      className="clear-filter">
        Показать всё
      </button>
    </div>
  )
}