import React from 'react';
import { PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

const PDFReportTemplate = ({ registry, items, chartData, totalReach, totalEng, totalViews }) => {
    if (!registry || !items) return null;

    return (
        <div id="pdf-report-content" className="bg-[#ffffff] text-[#111827] font-sans w-[800px] mx-auto">
            {/* Cover Page */}
            <div className="min-h-[1100px] flex flex-col justify-between p-16 bg-[#0F172A] text-[#ffffff] relative overflow-hidden break-after-page">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#2563EB] rounded-full blur-[150px] opacity-20 transform translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#9333EA] rounded-full blur-[150px] opacity-20 transform -translate-x-1/3 translate-y-1/3" />

                <div className="relative z-10">
                    <div className="inline-block px-4 py-2 rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.1)] text-[#93C5FD] text-sm font-bold tracking-widest uppercase mb-8">
                        Relatório de Performance
                    </div>
                    <h1 className="text-6xl font-black mb-4 leading-tight">
                        {registry.brand_name}
                    </h1>
                    <p className="text-3xl text-[#D1D5DB] font-light">
                        Campanha <span className="font-semibold text-[#ffffff]">{registry.product_name}</span>
                    </p>
                </div>

                <div className="relative z-10">
                    <div className="grid grid-cols-2 gap-8 mb-12 border-t border-[rgba(255,255,255,0.1)] pt-8">
                        <div>
                            <p className="text-xs text-[#9CA3AF] uppercase tracking-widest mb-1">Período</p>
                            <p className="text-xl font-medium">
                                {new Date(registry.start_date).toLocaleDateString()} — {new Date(registry.end_date).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-[#9CA3AF] uppercase tracking-widest mb-1">Total de Conteúdos</p>
                            <p className="text-xl font-medium">{items.length} publicações</p>
                        </div>
                    </div>
                    <div className="text-xs text-[#6B7280] font-mono">
                        Gerado por Meganálise • {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Executive Summary & Charts */}
            <div className="p-12 break-after-page min-h-[1100px] relative">
                <div className="mb-12 border-b border-[#F3F4F6] pb-8">
                    <h2 className="text-3xl font-bold text-[#111827] mb-2">Resumo Executivo</h2>
                    <p className="text-[#6B7280]">Visão geral dos resultados alcançados.</p>
                </div>

                {/* Big Numbers Row */}
                <div className="grid grid-cols-3 gap-8 mb-16">
                    <div className="p-6 bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE]">
                        <p className="text-sm font-bold text-[#2563EB] uppercase tracking-wide mb-2">Alcance Total</p>
                        <p className="text-4xl font-black text-[#111827]">{totalReach.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-[#FAF5FF] rounded-2xl border border-[#F3E8FF]">
                        <p className="text-sm font-bold text-[#9333EA] uppercase tracking-wide mb-2">Engajamento Total</p>
                        <p className="text-4xl font-black text-[#111827]">{totalEng.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-[#F0FDF4] rounded-2xl border border-[#DCFCE7]">
                        <p className="text-sm font-bold text-[#16A34A] uppercase tracking-wide mb-2">Visualizações</p>
                        <p className="text-4xl font-black text-[#111827]">{totalViews.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    <div className="bg-[#F9FAFB] rounded-3xl p-8 border border-[#F3F4F6]">
                        <h3 className="text-lg font-bold text-[#111827] mb-6">Distribuição por Plataforma</h3>
                        <div className="flex items-center justify-center">
                            {/* Recharts doesn't render well in hidden/static HTML for PDF usually without fixed dimensions. 
                                  We might replace this with a static legend if charts fail, but let's try. 
                                  Often simpler HTML bars are safer for PDF generation than SVG/Canvas if rendering issues occur.
                                  Let's stick to a simple custom list for reliability in PDF.
                              */}
                            <div className="w-full space-y-4">
                                {chartData.map((item, index) => (
                                    <div key={item.name} className="flex items-center gap-4">
                                        <div className="w-32 text-sm font-bold text-[#4B5563]">{item.name}</div>
                                        <div className="flex-1 h-4 bg-[#E5E7EB] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${(item.value / totalViews) * 100}%`,
                                                    backgroundColor: COLORS[index % COLORS.length]
                                                }}
                                            />
                                        </div>
                                        <div className="w-24 text-right text-sm font-bold text-[#111827]">
                                            {((item.value / totalViews) * 100).toFixed(1)}%
                                        </div>
                                        <div className="w-24 text-right text-sm text-[#6B7280]">
                                            {item.value.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content List */}
            <div className="p-12 min-h-[1100px]">
                <div className="mb-8 border-b border-[#F3F4F6] pb-8">
                    <h2 className="text-3xl font-bold text-[#111827] mb-2">Detalhamento de Conteúdo</h2>
                    <p className="text-[#6B7280]">Performance individual de todas as publicações.</p>
                </div>

                <div className="space-y-6">
                    {items.map((item, index) => (
                        <div key={item.id} className="flex gap-6 p-4 border border-[#F3F4F6] rounded-xl break-inside-avoid bg-[#ffffff] shadow-none">
                            {/* Identifier / Index */}
                            <div className="w-8 flex-shrink-0 flex items-center justify-center font-bold text-[#D1D5DB]">
                                #{index + 1}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-[#ffffff] uppercase
                                        ${item.platform === 'instagram' ? 'bg-[#DB2777]' :
                                            item.platform === 'tiktok' ? 'bg-[#000000]' :
                                                item.platform === 'facebook' ? 'bg-[#2563EB]' : 'bg-[#6B7280]'}
                                    `}>
                                        {item.platform}
                                    </span>
                                    <span className="text-xs text-[#6B7280] font-medium">
                                        {new Date(item.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-[#111827] line-clamp-2 leading-snug mb-2">
                                    {item.title || item.caption || "Sem legenda"}
                                </h4>
                                <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                                    <span className="font-semibold text-[#374151]">{item.influencer_name}</span>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="w-64 flex-shrink-0 grid grid-cols-3 gap-2">
                                <div className="p-2 bg-[rgba(239,246,255,0.5)] rounded-lg text-center">
                                    <p className="text-[10px] uppercase text-[#3B82F6] font-bold mb-0.5">Views</p>
                                    <p className="text-sm font-bold text-[#111827]">{item.views?.toLocaleString() || '-'}</p>
                                </div>
                                <div className="p-2 bg-[rgba(250,245,255,0.5)] rounded-lg text-center">
                                    <p className="text-[10px] uppercase text-[#A855F7] font-bold mb-0.5">Engaj.</p>
                                    <p className="text-sm font-bold text-[#111827]">
                                        {((item.likes || 0) + (item.comments || 0) + (item.shares || 0)).toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-2 bg-[#F9FAFB] rounded-lg text-center">
                                    <p className="text-[10px] uppercase text-[#6B7280] font-bold mb-0.5">Alcance</p>
                                    <p className="text-sm font-bold text-[#111827]">{item.reach?.toLocaleString() || '-'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PDFReportTemplate;
