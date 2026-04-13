-- =====================================================
-- 智能比价模块数据库表 (v1.4.0)
-- =====================================================

-- 1. 供货平台表
CREATE TABLE IF NOT EXISTS supply_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL, -- 1688/阿里国际站/拼多多跨境/速卖通
    logo_url VARCHAR(500),
    base_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(200),
    api_secret VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 商品比价记录表
CREATE TABLE IF NOT EXISTS price_comparison_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_title VARCHAR(500) NOT NULL,
    product_image VARCHAR(500),
    search_keyword VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/searching/completed/failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 比价结果表
CREATE TABLE IF NOT EXISTS comparison_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES price_comparison_records(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES supply_platforms(id) ON DELETE CASCADE,
    supplier_name VARCHAR(200) NOT NULL,
    product_title VARCHAR(500) NOT NULL,
    product_url VARCHAR(500) NOT NULL,
    product_image VARCHAR(500),
    min_order_quantity INTEGER NOT NULL DEFAULT 1, -- 起订量
    unit_price DECIMAL(12,2) NOT NULL, -- 单价
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
    shipping_cost DECIMAL(12,2) DEFAULT 0, -- 运费
    total_cost DECIMAL(12,2) NOT NULL, -- 总成本(单价+运费)
    delivery_days INTEGER, -- 发货时效
    supplier_rating DECIMAL(3,2), -- 供应商评分 0-5
    sales_volume INTEGER, -- 销量
    similarity_score DECIMAL(5,4) NOT NULL DEFAULT 0, -- 相似度 0-1
    has_free_shipping BOOLEAN DEFAULT false,
    has_warehouse BOOLEAN DEFAULT false, -- 是否有海外仓
    product_specs JSONB, -- 商品规格参数
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_price_comparison_records_user_id ON price_comparison_records(user_id);
CREATE INDEX IF NOT EXISTS idx_price_comparison_records_product_id ON price_comparison_records(product_id);
CREATE INDEX IF NOT EXISTS idx_comparison_results_record_id ON comparison_results(record_id);
CREATE INDEX IF NOT EXISTS idx_comparison_results_total_cost ON comparison_results(total_cost);
CREATE INDEX IF NOT EXISTS idx_comparison_results_similarity ON comparison_results(similarity_score DESC);

-- RLS策略
ALTER TABLE supply_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supply platforms are viewable by everyone" ON supply_platforms FOR SELECT USING (true);

ALTER TABLE price_comparison_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own comparison records" ON price_comparison_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own comparison records" ON price_comparison_records FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE comparison_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own comparison results" ON comparison_results FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM price_comparison_records r
    WHERE r.id = record_id AND r.user_id = auth.uid()
  )
);

-- 触发器
CREATE TRIGGER trigger_supply_platforms_update_updated_at
BEFORE UPDATE ON supply_platforms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_price_comparison_records_update_updated_at
BEFORE UPDATE ON price_comparison_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认供货平台数据
INSERT INTO supply_platforms (name, base_url, sort_order) VALUES
('1688', 'https://www.1688.com', 1),
('阿里国际站', 'https://www.alibaba.com', 2),
('拼多多跨境', 'https://kuajing.pinduoduo.com', 3),
('速卖通', 'https://www.aliexpress.com', 4)
ON CONFLICT DO NOTHING;
