'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, DollarSign, Star, Truck, Clock, CheckCircle, AlertCircle, RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Product } from '@/lib/types/product';
import { ComparisonResult, PriceComparisonRecord } from '@/lib/types/price-comparison';
import toast from 'react-hot-toast';

interface PriceComparisonModalProps {
  product: Product;
  currencySymbol: string;
  onSelectSupplier?: (purchaseCost: number, shippingCost: number) => void;
}

// 获取平台颜色
function getPlatformColor(platformName?: string): string {
  switch (platformName) {
    case '1688': return 'bg-orange-100 text-orange-800 border-orange-500';
    case '阿里国际站': return 'bg-blue-100 text-blue-800 border-blue-500';
    case '拼多多跨境': return 'bg-red-100 text-red-800 border-red-500';
    case '速卖通': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
    default: return 'bg-gray-100 text-gray-800 border-gray-500';
  }
}

// 格式化相似度
function formatSimilarity(score: number): string {
  return `${Math.round(score * 100)}% 匹配`;
}

export default function PriceComparisonModal({ product, currencySymbol, onSelectSupplier }: PriceComparisonModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [record, setRecord] = useState<PriceComparisonRecord | null>(null);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'similarity' | 'delivery'>('price');
  const [pollingCount, setPollingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');
  const [historyRecords, setHistoryRecords] = useState<PriceComparisonRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 启动比价任务
  const startComparison = useCallback(async () => {
    if (!product.title) return;

    setLoading(true);
    setRecordId(null);
    setRecord(null);
    setResults([]);
    setPollingCount(0);

    try {
      const response = await fetch('/api/price-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_title: product.title,
          product_image: product.image_urls?.[0],
          product_id: product.id,
          weight: product.weight
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '启动比价失败');
      }

      setRecordId(data.data.record_id);
      toast.success('比价任务已启动，正在搜索货源...');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '启动比价失败');
      setLoading(false);
    }
  }, [product]);

  // 查询比价结果
  const fetchResults = useCallback(async () => {
    if (!recordId) return;

    try {
      const response = await fetch(`/api/price-comparison?record_id=${recordId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '查询结果失败');
      }

      setRecord(data.data.record);

      if (data.data.record.status === 'completed') {
        setResults(data.data.results || []);
        setLoading(false);
        toast.success(`找到 ${data.data.results?.length || 0} 个匹配货源`);
      } else if (data.data.record.status === 'failed') {
        setLoading(false);
        toast.error(data.data.record.error_message || '比价失败');
      } else {
        // 继续轮询
        setPollingCount(prev => prev + 1);
        if (pollingCount < 20) { // 最多轮询20次，约1分钟
          setTimeout(fetchResults, 3000);
        } else {
          setLoading(false);
          toast.error('比价超时，请稍后重试');
        }
      }
    } catch (error) {
      console.error('查询结果失败:', error);
      setLoading(false);
    }
  }, [recordId, pollingCount]);

  // 当recordId变化时开始轮询
  useEffect(() => {
    if (recordId) {
      fetchResults();
    }
  }, [recordId, fetchResults]);

  // 获取比价历史
  const fetchComparisonHistory = useCallback(async () => {
    if (!isOpen || activeTab !== 'history') return;

    setHistoryLoading(true);
    try {
      const response = await fetch('/api/price-comparison?history=true');
      const data = await response.json();
      if (data.success) {
        setHistoryRecords(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch comparison history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [isOpen, activeTab]);

  // 打开弹窗时自动启动比价或加载历史
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'search') {
        startComparison();
      } else {
        fetchComparisonHistory();
      }
    }
  }, [isOpen, activeTab, startComparison, fetchComparisonHistory]);

  // 判断价格是否异常
  const isPriceAnomaly = useCallback((result: ComparisonResult, allResults: ComparisonResult[]) => {
    if (allResults.length < 3) return false; // 少于3个结果不判断
    const avgPrice = allResults.reduce((sum, r) => sum + r.total_cost, 0) / allResults.length;
    // 低于均价30% 或 高于均价50% 视为异常
    return result.total_cost < avgPrice * 0.7 || result.total_cost > avgPrice * 1.5;
  }, []);

  // 排序结果
  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.total_cost - b.total_cost;
      case 'similarity':
        return b.similarity_score - a.similarity_score;
      case 'delivery':
        return (a.delivery_days || 999) - (b.delivery_days || 999);
      default:
        return 0;
    }
  });

  // 选择货源
  const handleSelectSupplier = (result: ComparisonResult) => {
    toast.success(
      <div className="space-y-1">
        <p className="font-bold">✅ Supplier selected</p>
        <p className="text-xs text-white/70">
          {result.supplier_name} - ¥{result.total_cost.toFixed(2)}
        </p>
      </div>,
      { duration: 3000 }
    );

    // 同步到利润计算器
    if (onSelectSupplier) {
      onSelectSupplier(result.unit_price, result.shipping_cost);
    }

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-white hover:bg-gray-100 text-black font-bold text-base h-12 border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          COMPARE SUPPLIERS
        </Button>
      </DialogTrigger>
      <DialogContent className="border-4 border-black bg-white max-w-4xl p-0 rounded-none shadow-[12px_12px_0px_0px_#000] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-green-600 text-white p-6 border-b-4 border-black">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-display font-heavy text-white flex items-center gap-2">
              <Search className="w-6 h-6" />
              SUPPLIER PRICE COMPARISON
            </DialogTitle>
            {loading && (
              <div className="flex items-center gap-2 text-sm font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                搜索中...
              </div>
            )}
          </div>
          <p className="text-white/80 font-bold text-sm mt-1">
            搜索全网供货平台同款货源，自动比价计算成本
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* 标签切换 */}
            <div className="flex border-b-2 border-black mb-4">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-3 px-4 font-bold text-sm transition-all ${
                  activeTab === 'search'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                <Search className="w-4 h-4 inline mr-1" />
                NEW SEARCH
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 px-4 font-bold text-sm transition-all ${
                  activeTab === 'history'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-1" />
                HISTORY
              </button>
            </div>

            {activeTab === 'search' && (
              <>
                {/* 产品信息 */}
                <div className="p-4 bg-gray-50 border-2 border-black mb-4">
                  <h4 className="font-bold text-lg mb-2">{product.title}</h4>
                  <div className="flex items-center gap-4 text-sm font-bold">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-red-600" />
                      Price: {currencySymbol}{product.current_price.toFixed(2)}
                    </span>
                    {product.weight && (
                      <span className="flex items-center gap-1">
                        <Truck className="w-4 h-4 text-blue-600" />
                        Weight: {product.weight}kg
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'search' && (
              <>
                {/* 搜索中状态 */}
                {loading && (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-12">
                  <div className="space-y-4 text-center">
                    <RefreshCw className="w-12 h-12 mx-auto animate-spin text-green-600" />
                    <p className="font-bold text-lg">正在全网搜索同款货源...</p>
                    <p className="text-sm text-gray-500">
                      正在查询1688/阿里国际站/拼多多跨境等平台，预计需要5-10秒
                    </p>
                  </div>
                </div>
                {/* 骨架屏 */}
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 border-2 border-black bg-gray-50 animate-pulse">
                    <div className="h-6 bg-gray-200 mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 mb-2 w-1/2"></div>
                    <div className="h-4 bg-gray-200 w-1/3"></div>
                  </div>
                ))}
              </div>
            )}

            {/* 失败状态 */}
            {record?.status === 'failed' && !loading && (
              <div className="p-6 bg-red-50 border-2 border-red-600 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
                <p className="font-bold text-lg text-red-700 mb-2">比价失败</p>
                <p className="text-sm text-red-600 mb-4">{record.error_message}</p>
                <Button
                  onClick={startComparison}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                >
                  重新搜索
                </Button>
              </div>
            )}

            {/* 排序选项 */}
            {sortedResults.length > 0 && !loading && (
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('price')}
                  className={`flex-1 py-3 px-4 font-bold text-sm border-2 transition-all ${
                    sortBy === 'price'
                      ? 'bg-green-600 text-white border-black'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  价格最低
                </button>
                <button
                  onClick={() => setSortBy('similarity')}
                  className={`flex-1 py-3 px-4 font-bold text-sm border-2 transition-all ${
                    sortBy === 'similarity'
                      ? 'bg-green-600 text-white border-black'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                  }`}
                >
                  <Star className="w-4 h-4 inline mr-1" />
                  匹配度最高
                </button>
                <button
                  onClick={() => setSortBy('delivery')}
                  className={`flex-1 py-3 px-4 font-bold text-sm border-2 transition-all ${
                    sortBy === 'delivery'
                      ? 'bg-green-600 text-white border-black'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  发货最快
                </button>
              </div>
            )}

            {/* 比价结果列表 */}
            {sortedResults.length > 0 && !loading && (
              <div className="space-y-4">
                {sortedResults.map((result, index) => (
                  <div
                    key={result.id}
                    className={`relative p-5 border-2 transition-all hover:border-green-600 ${
                      index === 0 ? 'border-green-600 bg-green-50 shadow-[4px_4px_0px_0px_#16a34a]' : 'border-black bg-white'
                    }`}
                  >
                    {/* 最优标签 */}
                    {index === 0 && (
                      <div className="absolute -top-3 -left-2 px-3 py-1 bg-green-600 text-white text-xs font-bold border-2 border-black z-10">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        最优选择
                      </div>
                    )}

                    {/* 头部：供应商信息+价格 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 flex items-center justify-center font-display font-heavy text-lg border-2 ${getPlatformColor(result.platform?.name)}`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{result.supplier_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 font-bold border border-black ${getPlatformColor(result.platform?.name)}`}>
                              {result.platform?.name}
                            </span>
                            <span className="text-xs font-bold text-gray-600">
                              匹配度: {formatSimilarity(result.similarity_score)}
                            </span>
                            {result.has_warehouse && (
                              <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-1 border border-purple-500">
                                海外仓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-mono font-heavy text-green-600">
                          ¥{result.total_cost.toFixed(2)}
                        </div>
                        <div className="text-xs font-bold text-gray-600">
                          单价: ¥{result.unit_price.toFixed(2)} + 运费: ¥{result.shipping_cost.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* 详情网格 */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 bg-white border-2 border-black">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-gray-600">发货时效</span>
                        </div>
                        <p className="font-mono font-bold text-lg">{result.delivery_days}天</p>
                      </div>

                      <div className="p-3 bg-white border-2 border-black">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-4 h-4 text-yellow-600" />
                          <span className="text-xs font-bold text-gray-600">供应商评分</span>
                        </div>
                        <p className="font-mono font-bold text-lg">{result.supplier_rating} ⭐</p>
                      </div>

                      <div className="p-3 bg-white border-2 border-black">
                        <div className="flex items-center gap-1 mb-1">
                          <Truck className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-bold text-gray-600">起订量</span>
                        </div>
                        <p className="font-mono font-bold text-lg">{result.min_order_quantity}件</p>
                      </div>
                    </div>

                    {/* 商品标题 */}
                    <div className="p-3 bg-gray-100 border-2 border-black mb-4">
                      <p className="text-sm font-bold line-clamp-2">{result.product_title}</p>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => window.open(result.product_url, '_blank')}
                        className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold h-12 border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        VIEW SUPPLIER DETAILS
                      </Button>
                      <Button
                        onClick={() => handleSelectSupplier(result)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        SYNC TO PROFIT CALCULATOR
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

                {/* 无结果状态 */}
                {!loading && record?.status === 'completed' && sortedResults.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="font-bold text-lg text-gray-600">No matching suppliers found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Try adjusting keywords or search again later
                    </p>
                    <Button
                      onClick={startComparison}
                      className="mt-4 bg-black hover:bg-gray-800 text-white font-bold border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                    >
                      SEARCH AGAIN
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* 历史记录标签内容 */}
            {activeTab === 'history' && (
              <>
                {historyLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 mx-auto animate-spin text-green-600 mb-4" />
                    <p className="font-bold text-lg">Loading history...</p>
                  </div>
                ) : historyRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="font-bold text-lg text-gray-600">No comparison history</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Your past price comparisons will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyRecords.map((history) => (
                      <div
                        key={history.id}
                        className="p-4 border-2 border-black bg-white hover:border-green-600 transition-all cursor-pointer"
                        onClick={() => {
                          setRecordId(history.id);
                          setActiveTab('search');
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg line-clamp-1">{history.product_title}</h4>
                          <span
                            className={`text-xs px-2 py-1 font-bold border ${
                              history.status === 'completed'
                                ? 'bg-green-100 text-green-800 border-green-500'
                                : history.status === 'failed'
                                ? 'bg-red-100 text-red-800 border-red-500'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-500'
                            }`}
                          >
                            {history.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="font-bold">
                            {new Date(history.created_at).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <ArrowRight className="w-4 h-4 text-green-600" />
                            Click to view details
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
