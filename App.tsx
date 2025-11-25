import React, { useState } from 'react';
import { Beer, ViewState } from './types';
import { useAuth } from './src/hooks/useAuth';
import { useBeerData } from './src/hooks/useBeerData';
import { NavItem } from './src/components/shared/NavItem';
import Dashboard from './src/views/Dashboard';
import Search from './src/views/Search';
import Detail from './src/views/Detail';
import Profile from './src/views/Profile';
import { Home, Search as SearchIcon, User, Beer as BeerIcon } from 'lucide-react';
import { FunkyToast } from './components/FunkyComponents';
import LoginScreen from './src/components/LoginScreen';

function App() {
  const auth = useAuth();
  const beerData = useBeerData(auth.user, auth.isGuest);

  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const NAV_ITEMS = [
    { id: ViewState.DASHBOARD, label: 'Taproom', icon: <Home size={18} fill="currentColor" /> },
    { id: ViewState.SEARCH, label: 'Cellar', icon: <SearchIcon size={18} strokeWidth={3} /> },
    { id: ViewState.PROFILE, label: 'My Tab', icon: <User size={18} fill="currentColor" /> },
  ];

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddBeerLog = async (beer: Beer) => {
    await beerData.handleAddBeerLog(beer);
    showToast(`${beer.name} logged!`, 'success');
  };

  return (
    <div className="min-h-screen font-sans text-slate-600 bg-[#f8fafc]">
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={() => setView(ViewState.DASHBOARD)}
              className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded-lg"
              aria-label="Go to Taproom"
            >
              <BeerIcon className="w-6 h-6 text-black" />
              <span className="font-black text-xl text-black uppercase">BeerCount</span>
            </button>
            <nav className="flex gap-2">
              {NAV_ITEMS.map(item => (
                <NavItem
                  key={item.id}
                  active={view === item.id}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => setView(item.id)}
                  desktop
                />
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {auth.isGuest || auth.user ? (
          <>
            {view === ViewState.DASHBOARD && (
              <Dashboard
                user={auth.user}
                logs={beerData.logs}
                myBeers={beerData.myBeers}
                setView={setView}
                setSelectedBeer={setSelectedBeer}
              />
            )}

            {view === ViewState.SEARCH && (
              <Search
                myBeers={beerData.myBeers}
                logs={beerData.logs}
                allBeers={beerData.allBeers}
                executeSearch={beerData.executeSearch}
                setView={setView}
                setSelectedBeer={setSelectedBeer}
                handleAddBeerLog={handleAddBeerLog}
                isCatalogLoading={beerData.isCatalogLoading}
              />
            )}

            {view === ViewState.DETAIL && (
              <Detail
                selectedBeer={selectedBeer}
                setView={setView}
                logs={beerData.logs}
                handleAddBeerLog={handleAddBeerLog}
              />
            )}

            {view === ViewState.PROFILE && (
              <Profile
                user={auth.user}
                logs={beerData.logs}
                myBeers={beerData.myBeers}
                handleAddBeerLog={handleAddBeerLog}
                setView={setView}
                setSelectedBeer={setSelectedBeer}
                setIsGuest={auth.setIsGuest}
                handleLogout={auth.handleLogout}
              />
            )}
          </>
        ) : (
          <LoginScreen
            onLogin={() => { }}
            onGuest={auth.handleGuestMode}
            authMode={auth.authMode}
            setAuthMode={auth.setAuthMode}
            email={auth.email}
            setEmail={auth.setEmail}
            password={auth.password}
            setPassword={auth.setPassword}
          />
        )}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50">
        <div className="grid grid-cols-3">
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.id}
              active={view === item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => setView(item.id)}
            />
          ))}
        </div>
      </nav>

      {/* Toast Notifications */}
      {toast && <FunkyToast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
