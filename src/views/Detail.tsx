import React from 'react';
import { Beer, LogEntry, ViewState } from '../../types';
import { FunkyButton } from '../../components/FunkyComponents';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { getBeerStats } from '../utils/calculations';

interface DetailProps {
  selectedBeer: Beer | null;
  setView: (view: ViewState) => void;
  logs: LogEntry[];
  handleAddBeerLog: (beer: Beer) => void;
}

const Detail: React.FC<DetailProps> = ({
  selectedBeer,
  setView,
  logs,
  handleAddBeerLog
}) => {
  if (!selectedBeer) {
    setView(ViewState.SEARCH);
    return null;
  }

  const count = getBeerStats(selectedBeer.id, logs);

  return (
    <div className="pb-24 animate-fade-in">
      <button
        onClick={() => setView(ViewState.SEARCH)}
        className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 font-bold text-sm uppercase"
      >
        <ChevronLeft size={16} /> Back to Cellar
      </button>

      <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-8">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-24 h-24 bg-white text-5xl flex items-center justify-center border-2 border-black flex-shrink-0">
              {selectedBeer.imageUrl ? (
                <img src={selectedBeer.imageUrl} alt={selectedBeer.name} className="w-full h-full object-contain" />
              ) : (
                <span>{selectedBeer.emoji || '🍺'}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-black uppercase mb-2">{selectedBeer.name}</h1>
              <p className="text-gray-500 font-bold uppercase text-sm mb-4">{selectedBeer.brewery}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-black text-white border-2 border-black text-xs font-bold uppercase">
                  {selectedBeer.type}
                </span>
                <span className="px-3 py-1 bg-white text-black border-2 border-black text-xs font-bold uppercase">
                  {selectedBeer.abv} ABV
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 border-2 border-black mb-6">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-black">{count}</span>
              <span className="text-sm text-gray-500 font-bold mb-1.5 uppercase">pints tracked</span>
            </div>
            <p className="text-xs text-gray-400 mt-2 font-bold uppercase">
              {count === 0 ? "You haven't logged this one yet." :
                count === 1 ? "Just the first taste." :
                  "You're becoming a regular."}
            </p>
          </div>

          <FunkyButton
            onClick={() => handleAddBeerLog(selectedBeer)}
            className="w-full py-4 text-lg"
            pulseOnClick
            pulseDurationMs={750}
            pressText={<span className="flex items-center gap-2">🎉 <span className="font-bold">Chugged!</span></span>}
          >
            <span className="flex items-center gap-2">Pour One <ArrowRight size={20} /></span>
          </FunkyButton>
        </div>
      </div>
    </div>
  );
};

export default Detail;
