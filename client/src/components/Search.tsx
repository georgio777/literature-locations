import { useMapStore } from "../store/mapStore";
import { useDebounce } from "use-debounce";
import { useState, useEffect, useRef } from "react";
import useFilter from "../hooks/useFilter";
import { Location } from "../types";
import './Search.css'
import useClickOutside from "../hooks/useClickOutside";

interface SearchResult {
  value: string;
  type: 'name' | 'author' | 'fiction';
}

function Search() {
  const { data, clearFiltered } = useMapStore();
  const [text, setText] = useState('');
  const [debouncedQuery] = useDebounce(text, 1000);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const filter = useFilter()
  const [ resultsVisible, setResultsVisible ] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useClickOutside(searchRef, () => { 
    setResultsVisible(false) 
  })

  useEffect(() => {
    if (!data || !debouncedQuery) {
      setSearchResults([]);
      return;
    }

    const query = debouncedQuery.toLowerCase();
    const results: SearchResult[] = [];

    data.forEach(location => {
      if (location.name.toLowerCase().includes(query)) {
        results.push({ value: location.name, type: 'name' });
      }
      if (location.author.toLowerCase().includes(query)) {
        results.push({ value: location.author, type: 'author' });
      }
      if (location.fiction.toLowerCase().includes(query)) {
        results.push({ value: location.fiction, type: 'fiction' });
      }
    });

    // Удаляем дубликаты
    const uniqueResults = results.filter(
      (result, index, self) =>
        index === self.findIndex(r => 
          r.value === result.value && r.type === result.type
        )
    );    

    setSearchResults(uniqueResults);
    setResultsVisible(true)
  }, [debouncedQuery, data]);

  const onSearchClick = (type: keyof Location, value: string) => {
    filter(type, value)
    setSearchResults([])
  }

  const clearSearch = () => {
    clearFiltered()
    setText('')
  }

  return (
    <div className="search-wrapper">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setResultsVisible(true)}
        placeholder="Поиск"
        type="search"
        className="search-input"
      />
      <button 
      className="clear-search"
      onClick={clearSearch}>
        Очистить
      </button>
      { searchResults && resultsVisible && searchResults.length > 0 && 
        <div 
        ref={searchRef}
        className="results">
          <ul className="results-list">
            {searchResults.map((result, index) => (
              <li 
              onClick={() => onSearchClick(result.type, result.value)}
              key={`${result.type}-${index}`}
              className="results-item">
                {result.value}
              </li>
            ))}
          </ul>
        </div>
      }
    </div>
  );
}

export default Search;