import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  coverPage: {
    backgroundColor: '#0F172A',
    color: '#ffffff',
    padding: 60,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%'
  },
  coverTitleContainer: {
    marginTop: 100,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#93C5FD',
    fontSize: 10,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: 20
  },
  brandName: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10
  },
  productName: {
    fontSize: 24,
    color: '#D1D5DB'
  },
  productNameHighlight: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  coverFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 30,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  coverFooterCol: {
    flex: 1
  },
  coverFooterLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  coverFooterValue: {
    fontSize: 16,
    color: '#ffffff'
  },
  footerText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 20
  },
  contentPage: {
    padding: 40,
    backgroundColor: '#ffffff'
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 20,
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280'
  },
  statsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40
  },
  statBoxBlue: { flex: 1, padding: 20, backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, borderColor: '#DBEAFE', marginRight: 10 },
  statBoxPurple: { flex: 1, padding: 20, backgroundColor: '#FAF5FF', borderRadius: 12, borderWidth: 1, borderColor: '#F3E8FF', marginHorizontal: 5 },
  statBoxGreen: { flex: 1, padding: 20, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7', marginLeft: 10 },
  statLabelBlue: { fontSize: 10, fontWeight: 'bold', color: '#2563EB', textTransform: 'uppercase', marginBottom: 8 },
  statLabelPurple: { fontSize: 10, fontWeight: 'bold', color: '#9333EA', textTransform: 'uppercase', marginBottom: 8 },
  statLabelGreen: { fontSize: 10, fontWeight: 'bold', color: '#16A34A', textTransform: 'uppercase', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  
  platformDistBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 30,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 30
  },
  platformDistTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20
  },
  platformRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  platformName: {
    width: 60,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563'
  },
  platformBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginHorizontal: 10,
    overflow: 'hidden'
  },
  platformBarFill: {
    height: 12,
    borderRadius: 6
  },
  platformPercent: {
    width: 40,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827'
  },
  platformCount: {
    width: 60,
    textAlign: 'right',
    fontSize: 12,
    color: '#6B7280'
  },

  contentList: {
    display: 'flex',
    flexDirection: 'column'
  },
  contentItem: {
    display: 'flex',
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#ffffff'
  },
  contentIndex: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D1D5DB',
  },
  contentInfo: {
    flex: 1,
    paddingRight: 10
  },
  contentHeaderRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  contentPlatformTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    marginRight: 6
  },
  contentDate: {
    fontSize: 10,
    color: '#6B7280'
  },
  contentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  contentMetrics: {
    width: 180,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  metricBox: {
    flex: 1,
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 2
  },
  metricLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2
  },
  metricValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827'
  }
});

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

const VectorPDFTemplate = ({ registry, items = [], chartData = [], totalReach = 0, totalEng = 0, totalViews = 0 }) => {
    if (!registry) return null;

    const getPlatformColor = (platform) => {
        if (!platform) return '#6B7280';
        const p = platform.toLowerCase();
        if (p === 'instagram') return '#DB2777';
        if (p === 'tiktok') return '#000000';
        if (p === 'facebook') return '#2563EB';
        return '#6B7280';
    };

    return (
        <Document>
            {/* Capa */}
            <Page size="A4" style={styles.coverPage}>
                <View style={styles.coverTitleContainer}>
                    <Text style={styles.tag}>Relatório de Performance</Text>
                    <Text style={styles.brandName}>{registry.brand_name || 'Brand'}</Text>
                    <Text style={styles.productName}>
                        Campanha <Text style={styles.productNameHighlight}>{registry.product_name || 'Campanha'}</Text>
                    </Text>
                </View>
                
                <View>
                    <View style={styles.coverFooter}>
                        <View style={styles.coverFooterCol}>
                            <Text style={styles.coverFooterLabel}>Período</Text>
                            <Text style={styles.coverFooterValue}>
                                {registry.start_date ? new Date(registry.start_date).toLocaleDateString() : ''} - {registry.end_date ? new Date(registry.end_date).toLocaleDateString() : ''}
                            </Text>
                        </View>
                        <View style={styles.coverFooterCol}>
                            <Text style={styles.coverFooterLabel}>Total de Conteúdos</Text>
                            <Text style={styles.coverFooterValue}>{items.length} publicações</Text>
                        </View>
                    </View>
                    <Text style={styles.footerText}>Gerado por Meganálise • {new Date().toLocaleDateString()}</Text>
                </View>
            </Page>

            {/* Página 2: Resumo Executivo */}
            <Page size="A4" style={styles.contentPage}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Resumo Executivo</Text>
                    <Text style={styles.sectionSubtitle}>Visão geral dos resultados alcançados.</Text>
                </View>

                {/* Big numbers */}
                <View style={styles.statsRow}>
                    <View style={styles.statBoxBlue}>
                        <Text style={styles.statLabelBlue}>Alcance Total</Text>
                        <Text style={styles.statValue}>{totalReach.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statBoxPurple}>
                        <Text style={styles.statLabelPurple}>Engajamento Total</Text>
                        <Text style={styles.statValue}>{totalEng.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statBoxGreen}>
                        <Text style={styles.statLabelGreen}>Visualizações</Text>
                        <Text style={styles.statValue}>{totalViews.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Grafico Barra Linha */}
                <View style={styles.platformDistBox}>
                    <Text style={styles.platformDistTitle}>Distribuição por Plataforma</Text>
                    {chartData.map((item, index) => {
                        const percent = totalViews > 0 ? (item.value / totalViews) * 100 : 0;
                        return (
                            <View key={item.name || index} style={styles.platformRow}>
                                <Text style={styles.platformName}>{item.name}</Text>
                                <View style={styles.platformBarBg}>
                                    <View style={[styles.platformBarFill, { width: `${percent}%`, backgroundColor: COLORS[index % COLORS.length] }]} />
                                </View>
                                <Text style={styles.platformPercent}>{percent.toFixed(1)}%</Text>
                                <Text style={styles.platformCount}>{item.value.toLocaleString()}</Text>
                            </View>
                        )
                    })}
                </View>
            </Page>

            {/* Detalhamento (Páginas múltiplas se necessário) */}
            <Page size="A4" style={styles.contentPage}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Detalhamento de Conteúdo</Text>
                    <Text style={styles.sectionSubtitle}>Performance individual de todas as publicações.</Text>
                </View>

                <View style={styles.contentList}>
                    {items.map((item, index) => (
                        <View key={item.id} style={styles.contentItem} wrap={false}>
                            <Text style={styles.contentIndex}>#{index + 1}</Text>
                            
                            <View style={styles.contentInfo}>
                                <View style={styles.contentHeaderRow}>
                                    <Text style={[styles.contentPlatformTag, { backgroundColor: getPlatformColor(item.platform) }]}>
                                        {item.platform}
                                    </Text>
                                    <Text style={styles.contentDate}>
                                        {item.date ? new Date(item.date).toLocaleDateString() : ''}
                                    </Text>
                                </View>
                                <Text style={styles.contentTitle}>
                                    {(item.title || item.caption || "Sem legenda").substring(0, 100)}
                                </Text>
                            </View>

                            <View style={styles.contentMetrics}>
                                <View style={[styles.metricBox, { backgroundColor: 'rgba(239,246,255,0.5)' }]}>
                                    <Text style={[styles.metricLabel, { color: '#3B82F6' }]}>Views</Text>
                                    <Text style={styles.metricValue}>{(item.views || 0).toLocaleString()}</Text>
                                </View>
                                <View style={[styles.metricBox, { backgroundColor: 'rgba(250,245,255,0.5)' }]}>
                                    <Text style={[styles.metricLabel, { color: '#A855F7' }]}>Engaj.</Text>
                                    <Text style={styles.metricValue}>{((item.likes || 0) + (item.comments || 0) + (item.shares || 0)).toLocaleString()}</Text>
                                </View>
                                <View style={[styles.metricBox, { backgroundColor: '#F9FAFB' }]}>
                                    <Text style={[styles.metricLabel, { color: '#6B7280' }]}>Alcance</Text>
                                    <Text style={styles.metricValue}>{(item.reach || 0).toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
};

export default VectorPDFTemplate;
