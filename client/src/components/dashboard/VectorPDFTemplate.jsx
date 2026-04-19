import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { dataService } from '../../services/dataService';

// Registrar fontes se necessário, mas Helvetica é padrão e segura.

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
    },
    // --- DESIGN DA CAPA ---
    coverPage: {
        backgroundColor: '#0F172A',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
    },
    coverContent: {
        flex: 1,
        padding: 60,
        justifyContent: 'center',
        zIndex: 10,
    },
    coverImageBg: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.3,
    },
    coverOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
    },
    coverTag: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 4,
        backgroundColor: '#3B82F6',
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        alignSelf: 'flex-start',
        marginBottom: 30
    },
    coverTitle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 10,
        lineHeight: 1.1
    },
    coverSubtitle: {
        fontSize: 24,
        color: '#94A3B8',
        fontWeight: 'light',
        marginBottom: 60
    },
    coverHighlight: {
        color: '#ffffff',
        fontWeight: 'bold'
    },
    coverFooter: {
        padding: 60,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
    },
    coverFooterItem: {
        flex: 1
    },
    coverFooterLabel: {
        fontSize: 10,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6
    },
    coverFooterValue: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: 'bold'
    },
    coverBrandLogo: {
        width: 100,
        opacity: 0.8
    },

    // --- DESIGN DAS PÁGINAS INTERNAS ---
    contentPage: {
        padding: 50,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 15
    },
    headerTitle: {
        fontSize: 10,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    pageNumber: {
        fontSize: 10,
        color: '#94A3B8'
    },
    sectionHeader: {
        marginBottom: 30
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#64748B'
    },

    // --- CARTÕES DE ESTATÍSTICAS ---
    statsGrid: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 40
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0F172A'
    },

    // --- DISTRIBUIÇÃO POR PLATAFORMA ---
    distCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 30,
        marginBottom: 30
    },
    distTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 25,
        textAlign: 'center'
    },
    distRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15
    },
    distName: {
        width: 80,
        fontSize: 11,
        fontWeight: 'bold',
        color: '#475569'
    },
    distTrack: {
        flex: 1,
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        marginHorizontal: 15,
        overflow: 'hidden'
    },
    distFill: {
        height: '100%',
        borderRadius: 4
    },
    distPercent: {
        width: 45,
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0F172A',
        textAlign: 'right'
    },
    distValue: {
        width: 70,
        fontSize: 11,
        color: '#64748B',
        textAlign: 'right'
    },

    // --- LISTA DE CONTEÚDO ---
    platformHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginBottom: 20,
        marginTop: 10
    },
    platformHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    contentGrid: {
        flexDirection: 'column',
        gap: 15
    },
    contentCard: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        backgroundColor: '#ffffff'
    },
    contentImage: {
        width: 80,
        height: 110,
        borderRadius: 10,
        objectFit: 'cover',
        backgroundColor: '#F8FAFC'
    },
    contentBody: {
        flex: 1,
        marginLeft: 20,
        justifyContent: 'space-between'
    },
    contentTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    contentMeta: {
        flexDirection: 'column',
        gap: 4
    },
    contentDate: {
        fontSize: 10,
        color: '#94A3B8'
    },
    contentAuthor: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0F172A'
    },
    contentTitle: {
        fontSize: 12,
        color: '#334155',
        lineHeight: 1.4,
        maxHeight: 40,
        overflow: 'hidden'
    },
    contentMetrics: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10
    },
    miniMetric: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center'
    },
    miniMetricLabel: {
        fontSize: 7,
        textTransform: 'uppercase',
        color: '#94A3B8',
        fontWeight: 'bold',
        marginBottom: 2
    },
    miniMetricValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0F172A'
    },
    platformBadge: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 4,
        fontSize: 8,
        fontWeight: 'bold',
        color: '#ffffff',
        textTransform: 'uppercase'
    }
});

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

const VectorPDFTemplate = ({ registry, items = [], chartData = [], totalReach = 0, totalEng = 0, totalViews = 0 }) => {
    if (!registry) return null;

    const getPlatformColor = (platform) => {
        if (!platform) return '#64748B';
        const p = platform.toLowerCase();
        if (p === 'instagram') return '#E1306C';
        if (p === 'tiktok') return '#000000';
        if (p === 'facebook') return '#1877F2';
        if (p === 'youtube') return '#FF0000';
        return '#64748B';
    };

    const groupedItems = items.reduce((acc, item) => {
        const platform = item.platform_type || item.platform || 'Social';
        const network = (item.social_network || platform).charAt(0).toUpperCase() + (item.social_network || platform).slice(1);
        if (!acc[network]) acc[network] = [];
        acc[network].push(item);
        return acc;
    }, {});

    const registryImageUrl = dataService.getRegistryImageUrl(registry);

    return (
        <Document>
            {/* --- CAPA --- */}
            <Page size="A4" style={styles.coverPage}>
                {registryImageUrl && (
                    <>
                        <Image src={registryImageUrl} style={styles.coverImageBg} />
                        <View style={styles.coverOverlay} />
                    </>
                )}
                
                <View style={styles.coverContent}>
                    <Text style={styles.coverTag}>Relatório de Evidências</Text>
                    <Text style={styles.coverTitle}>{registry.title || 'Relatório de Performance'}</Text>
                    <Text style={styles.coverSubtitle}>
                        Análise estratégica para <Text style={styles.coverHighlight}>{registry.country === 'BR' ? 'Brasil' : 'Paraguai'}</Text>
                    </Text>
                </View>
                
                <View style={styles.coverFooter}>
                    <View style={styles.coverFooterItem}>
                        <Text style={styles.coverFooterLabel}>Período de Análise</Text>
                        <Text style={styles.coverFooterValue}>
                            {registry.start_date ? new Date(registry.start_date).toLocaleDateString() : ''} - {registry.end_date ? new Date(registry.end_date).toLocaleDateString() : ''}
                        </Text>
                    </View>
                    <View style={styles.coverFooterItem}>
                        <Text style={styles.coverFooterLabel}>Volume de Dados</Text>
                        <Text style={styles.coverFooterValue}>{items.length} publicações capturadas</Text>
                    </View>
                    <View style={{ width: 80, alignItems: 'flex-end' }}>
                         <Text style={{ fontSize: 10, color: '#94A3B8' }}>MEGANÁLISE</Text>
                    </View>
                </View>
            </Page>

            {/* --- RESUMO EXECUTIVO --- */}
            <Page size="A4" style={styles.contentPage}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{registry.title} • Resumo Executivo</Text>
                    <Text style={styles.pageNumber}>Página 2</Text>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Indicadores de Performance</Text>
                    <Text style={styles.sectionSubtitle}>Métricas consolidadas de todas as plataformas monitoradas.</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { borderColor: '#DBEAFE', backgroundColor: '#EFF6FF' }]}>
                        <Text style={[styles.statLabel, { color: '#2563EB' }]}>Alcance Estimado</Text>
                        <Text style={styles.statValue}>{totalReach.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.statCard, { borderColor: '#F3E8FF', backgroundColor: '#FAF5FF' }]}>
                        <Text style={[styles.statLabel, { color: '#9333EA' }]}>Engajamento</Text>
                        <Text style={styles.statValue}>{totalEng.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.statCard, { borderColor: '#DCFCE7', backgroundColor: '#F0FDF4' }]}>
                        <Text style={[styles.statLabel, { color: '#16A34A' }]}>Visualizações</Text>
                        <Text style={styles.statValue}>{totalViews.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={styles.distCard}>
                    <Text style={styles.distTitle}>Distribuição Geográfica e de Audiência por Plataforma</Text>
                    {chartData.map((item, index) => {
                        const percent = totalViews > 0 ? (item.value / totalViews) * 100 : 0;
                        const color = COLORS[index % COLORS.length];
                        return (
                            <View key={item.name || index} style={styles.distRow}>
                                <Text style={styles.distName}>{item.name}</Text>
                                <View style={styles.distTrack}>
                                    <View style={[styles.distFill, { width: `${percent}%`, backgroundColor: color }]} />
                                </View>
                                <Text style={styles.distPercent}>{percent.toFixed(1)}%</Text>
                                <Text style={styles.distValue}>{item.value.toLocaleString()}</Text>
                            </View>
                        );
                    })}
                </View>
                
                <View style={{ marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 20 }}>
                    <Text style={{ fontSize: 9, color: '#94A3B8', textAlign: 'center' }}>
                        Relatório gerado em {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()} • © Meganálise Inteligência de Dados
                    </Text>
                </View>
            </Page>

            {/* --- DETALHAMENTO --- */}
            {Object.keys(groupedItems).sort().map((network, pageIdx) => (
                <Page key={network} size="A4" style={styles.contentPage}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{registry.title} • Detalhamento {network}</Text>
                        <Text style={styles.pageNumber}>Página {pageIdx + 3}</Text>
                    </View>

                    <View style={[styles.platformHeader, { backgroundColor: getPlatformColor(network) }]}>
                        <Text style={styles.platformHeaderText}>{network}</Text>
                    </View>

                    <View style={styles.contentGrid}>
                        {groupedItems[network].map((item, index) => {
                            const imageUrl = dataService.getContentImageUrl(item);
                            const eng = (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
                            
                            return (
                                <View key={item.id || index} style={styles.contentCard} wrap={false}>
                                    {imageUrl ? (
                                        <Image src={imageUrl} style={styles.contentImage} />
                                    ) : (
                                        <View style={[styles.contentImage, { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
                                            <Text style={{ fontSize: 8, color: '#94A3B8' }}>SEM IMAGEM</Text>
                                        </View>
                                    )}
                                    
                                    <View style={styles.contentBody}>
                                        <View>
                                            <View style={styles.contentTop}>
                                                <View style={styles.contentMeta}>
                                                    <Text style={styles.contentAuthor}>{item.influencer_name || item.author || 'Perfil Monitorado'}</Text>
                                                    <Text style={styles.contentDate}>{item.date ? new Date(item.date).toLocaleDateString() : ''}</Text>
                                                </View>
                                                <Text style={[styles.platformBadge, { backgroundColor: getPlatformColor(network) }]}>
                                                    {item.platform_type || item.platform || 'Post'}
                                                </Text>
                                            </View>
                                            <Text style={styles.contentTitle}>
                                                {(item.title || item.caption || "Conteúdo capturado via monitoramento.").substring(0, 140)}
                                                {(item.title || item.caption || "").length > 140 ? '...' : ''}
                                            </Text>
                                        </View>

                                        <View style={styles.contentMetrics}>
                                            <View style={styles.miniMetric}>
                                                <Text style={styles.miniMetricLabel}>Visualizações</Text>
                                                <Text style={styles.miniMetricValue}>{(item.views || 0).toLocaleString()}</Text>
                                            </View>
                                            <View style={styles.miniMetric}>
                                                <Text style={styles.miniMetricLabel}>Engajamento</Text>
                                                <Text style={styles.miniMetricValue}>{eng.toLocaleString()}</Text>
                                            </View>
                                            <View style={styles.miniMetric}>
                                                <Text style={styles.miniMetricLabel}>Alcance</Text>
                                                <Text style={styles.miniMetricValue}>{(item.reach || 0).toLocaleString()}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </Page>
            ))}
        </Document>
    );
};

export default VectorPDFTemplate;
