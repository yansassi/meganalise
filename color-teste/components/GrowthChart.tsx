
import React from 'react';
import { GROWTH_DATA } from '../constants';

const GrowthChart: React.FC = () => {
  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-[#1F2937]">Análise de Crescimento</h3>
          <p className="text-xs text-gray-400 font-medium">Comparativo mensal de ganhos e perdas</p>
        </div>
        <div className="relative">
          <button className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-semibold px-5 py-2.5 rounded-xl inline-flex items-center text-gray-600 transition-colors shadow-sm">
            Este Ano
            <i className="fa-solid fa-chevron-down ml-3 text-[10px] text-gray-400"></i>
          </button>
        </div>
      </div>

      {/* Custom Bar Chart Visualization */}
      <div className="relative h-64 w-full flex items-center justify-between px-2 pt-2">
        {/* Central Axis Line */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gray-100 transform -translate-y-1/2 z-0"></div>

        {/* Bars Container */}
        <div className="w-full h-full flex items-center justify-between px-2 z-10">
          {GROWTH_DATA.map((point, index) => {
            const isPositive = point.value >= 0;
            const barHeight = `${Math.abs(point.value)}%`;
            
            return (
              <div key={index} className="flex flex-col h-full w-[14px] mx-[2px] relative group">
                {/* Tooltip on hover */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                  {point.value}%
                </div>
                
                {/* Top half for positive bars */}
                <div className="flex-1 flex items-end justify-center pb-[2px]">
                  {isPositive && (
                    <div 
                      className="w-full bg-[#10B981] rounded-t-[2px] transition-all duration-1000 ease-out"
                      style={{ height: barHeight }}
                    ></div>
                  )}
                </div>
                
                {/* Bottom half for negative bars */}
                <div className="flex-1 flex items-start justify-center pt-[2px]">
                  {!isPositive && (
                    <div 
                      className="w-full bg-[#D946EF] rounded-b-[2px] transition-all duration-1000 ease-out"
                      style={{ height: barHeight }}
                    ></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-Axis Labels */}
      <div className="flex justify-between items-center mt-6 text-[10px] text-gray-400 font-bold px-4 tracking-tighter">
        <span>JAN</span>
        <span>FEV</span>
        <span>MAR</span>
        <span>ABR</span>
        <span>MAI</span>
        <span>JUN</span>
        <span>JUL</span>
        <span>AGO</span>
        <span>SET</span>
        <span>OUT</span>
        <span>NOV</span>
        <span>DEZ</span>
      </div>
    </section>
  );
};

export default GrowthChart;
