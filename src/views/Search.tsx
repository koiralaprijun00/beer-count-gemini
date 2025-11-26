import React, { useState, useEffect } from 'react';
import { Beer, LogEntry, ViewState } from '../../types';
import { FunkyButton, FunkyCard, FunkyInput } from '../../components/FunkyComponents';
import { Search as SearchIcon, Sparkles, Percent, Loader2, Zap, Filter, X } from 'lucide-react';
import { getCountryFlag, detectCountry } from '../utils/helpers';
import { getBeerStats } from '../utils/calculations';

interface SearchProps {
  myBeers: Beer[];
  logs: LogEntry[];
  allBeers: Beer[];
  executeSearch: (query: string) => Promise<Beer[]>;
  setView: (view: ViewState) => void;
  setSelectedBeer: (beer: Beer) => void;
  handleAddBeerLog: (beer: Beer) => void;
  isCatalogLoading: boolean;
}

const Search: React.FC<SearchProps> = ({
  myBeers,
  logs,
  allBeers,
  executeSearch,
  setView,
  setSelectedBeer,
  handleAddBeerLog,
  isCatalogLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<Beer[]>(allBeers);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const CATEGORY_FILTERS = ['All', 'Lager', 'IPA', 'Stout', 'Ale', 'Pilsner', 'Wheat Beer', 'Sour'];
  const COUNTRY_FILTERS = [
    'all',
    'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Barbados', 'Belgium', 'Bolivia',
    'Botswana', 'Brazil', 'Cambodia', 'Cameroon', 'Canada', 'Chile', 'China', 'Colombia',
    'Costa Rica', 'Croatia', 'Cuba', 'Czechia', 'Denmark', 'Dominican Republic', 'Ecuador',
    'Egypt', 'El Salvador', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Germany', 'Ghana',
    'Guatemala', 'Honduras', 'Hungary', 'India', 'Indonesia', 'Ireland', 'Israel', 'Italy',
    'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kyrgyzstan', 'Laos',
    'Latvia', 'Lebanon', 'Lithuania', 'Madagascar', 'Malawi', 'Malaysia', 'Mexico', 'Mongolia',
    'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
    'Nigeria', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
    'Puerto Rico', 'Russia', 'Rwanda', 'Samoa', 'Scotland', 'Senegal', 'Singapore',
    'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Suriname', 'Sweden', 'Tanzania',
    'Thailand', 'Tonga', 'Trinidad and Tobago', 'Turkey', 'UK', 'USA', 'Uganda', 'Ukraine',
    'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Zambia', 'Zimbabwe'
  ];

  const visibleCountries = showAllCountries ? COUNTRY_FILTERS : COUNTRY_FILTERS.slice(0, 16); // 'all' + 15 countries

  useEffect(() => {
    setSearchResults(myBeers);
  }, [myBeers]);

  // Lock body scroll when mobile filters are open
  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileFiltersOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await executeSearch(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSearchInputChange = async (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults(allBeers);
      await executeSearch('');
    }
  };

  const handleCategoryClick = (category: string) => {
    if (category === 'All') {
      setSelectedCategory(null);
      setSelectedCountry('all');
      setSearchQuery('');
      executeSearch('');
    } else {
      setSelectedCategory(category);
      setSelectedCountry('all');
      setSearchQuery('');
      executeSearch(category);
    }
  };

  const filteredResults = searchResults.filter(beer => {
    if (selectedCountry !== 'all') {
      const beerCountry = (beer as any).country || detectCountry(beer);
      if (beerCountry !== selectedCountry) return false;
    }
    return true;
  });

  const FilterContent = () => (
    <>
      <div className="bg-white p-5 border-2 border-black">
        <h3 className="font-bold text-black mb-4 text-sm uppercase tracking-wider">Filter by Style</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-3 py-1 text-xs font-bold border-2 transition-all uppercase ${(category === 'All' && selectedCategory === null) || selectedCategory === category
                ? 'bg-[var(--color-neon-green)] text-black border-black'
                : 'border-gray-200 text-gray-600 hover:border-black hover:text-black hover:bg-gray-100'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 border-2 border-black">
        <h3 className="font-bold text-black mb-4 text-sm uppercase tracking-wider">Filter by Country</h3>
        <div className="flex flex-wrap gap-2">
          {visibleCountries.map(country => (
            <button
              key={country}
              onClick={() => setSelectedCountry(country)}
              className={`px-3 py-2 text-xs font-bold border-2 transition-all uppercase ${selectedCountry === country
                ? 'bg-[var(--color-neon-green)] text-black border-black'
                : 'border-gray-200 text-gray-600 hover:border-black hover:text-black hover:bg-gray-100'
                }`}
            >
              {country === 'all' ? 'All' : country}
            </button>
          ))}
        </div>
        {COUNTRY_FILTERS.length > 16 && (
          <button
            onClick={() => setShowAllCountries(!showAllCountries)}
            className="mt-3 text-xs text-gray-600 hover:text-black font-bold underline"
          >
            {showAllCountries ? 'Show less' : `Show more (${COUNTRY_FILTERS.length - 16} more)`}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="pb-24 animate-fade-in relative">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          <FilterContent />
        </aside>

        {/* Mobile Filter Drawer */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
            <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl flex flex-col animate-slide-in-right">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <h2 className="font-black text-xl uppercase">Filters</h2>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <FilterContent />
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <FunkyButton onClick={() => setIsMobileFiltersOpen(false)}>
                  Show {filteredResults.length} Beers
                </FunkyButton>
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border-2 border-black p-5 sticky top-0 z-40 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-black tracking-tighter uppercase">The Cellar</h2>
                  <p className="text-gray-500 text-sm font-medium">Global database + AI Discovery.</p>
                </div>
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden p-2 border-2 border-black hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
              {(selectedCategory || selectedCountry !== 'all') && (
                <button
                  className="text-sm font-bold text-black hover:text-[var(--color-neon-green)] uppercase self-start md:self-auto"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedCountry('all');
                    setSearchQuery('');
                    setSearchResults(allBeers);
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>

            <form onSubmit={handleSearch} className="relative">
              <FunkyInput
                placeholder="Search for a brew (e.g. Guinness, IPA, Asahi...)"
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                autoFocus={searchResults.length === 0 && !isSearching}
                className="focus:border-black focus:ring-0"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-2 bg-black border-2 border-black text-[var(--color-neon-green)] hover:bg-gray-900 transition-colors shadow-none"
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="animate-spin w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
              </button>
            </form>
          </div>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 text-black bg-white border-2 border-black">
              <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
              <p className="font-bold uppercase animate-pulse">Scanning the global archives...</p>
            </div>
          ) : isCatalogLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-white border-2 border-black">
              <Loader2 className="w-6 h-6 animate-spin text-black mb-3" />
              <p className="text-sm font-bold uppercase">Loading Catalog.beer listings...</p>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-slate-600 flex items-center gap-2 text-sm uppercase tracking-wider px-1">
                <Zap className="w-4 h-4 text-teal-500" /> All Beers
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResults.map(beer => {
                  const count = getBeerStats(beer.id, logs);
                  const country = (beer as any).country || detectCountry(beer);
                  return (
                    <FunkyCard key={beer.id} onClick={() => { setSelectedBeer(beer); setView(ViewState.DETAIL); }} className="shadow-none hover:border-black relative flex flex-col h-full">
                      <div className="flex items-start justify-between gap-4 flex-grow">
                        <div className="flex gap-0 w-full">
                          <div className="w-14 h-14 bg-white text-3xl flex items-start justify-start overflow-hidden flex-shrink-0">
                            {beer.imageUrl ? (
                              <img src={beer.imageUrl} alt={beer.name} className="w-full h-full object-contain bg-white" />
                            ) : (
                              <span>{beer.emoji || '🍺'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-black leading-tight uppercase pr-2">{beer.name}</h4>
                              {country && (
                                <div className="relative group">
                                  <span className="text-2xl cursor-pointer self-start leading-none">
                                    {getCountryFlag(country)}
                                  </span>
                                  <span className="absolute -top-8 left-5 bg-black text-white px-2 py-1 text-xs font-bold uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {country}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-bold mb-2 uppercase">{beer.brewery}</p>
                            <div className="flex gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                {beer.type}
                              </span>
                              <div className="w-[2px] h-3 bg-gray-400"></div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                {beer.abv}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                        <FunkyButton
                          variant="secondary"
                          className="flex-1 !py-2 !text-xs shadow-none hover:shadow-none"
                          onClick={(e) => { e.stopPropagation(); setSelectedBeer(beer); setView(ViewState.DETAIL); }}
                        >
                          Details
                        </FunkyButton>
                        <FunkyButton
                          variant="primary"
                          className="flex-1 !py-2 !text-xs"
                          pulseOnClick
                          pulseDurationMs={750}
                          pressText={<span className="flex items-center gap-1">🎉 <span className="font-bold">Chugged!</span></span>}
                          onClick={(e) => { e.stopPropagation(); handleAddBeerLog(beer); }}
                        >
                          Pour One
                        </FunkyButton>
                      </div>
                    </FunkyCard>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
