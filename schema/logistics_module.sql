-- =====================================================
-- 物流模块数据库表 (v1.4.0)
-- 执行说明：在 Supabase SQL Editor 中复制粘贴执行
-- =====================================================

-- 11. 物流渠道表
CREATE TABLE IF NOT EXISTS logistics_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('postal', 'special_line', 'express', 'warehouse')),
    company_name VARCHAR(100) NOT NULL,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. 物流报价表 (按国家/重量区间)
CREATE TABLE IF NOT EXISTS logistics_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES logistics_channels(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    min_weight DECIMAL(8,2) NOT NULL,
    max_weight DECIMAL(8,2) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
    transit_days_min INTEGER NOT NULL,
    transit_days_max INTEGER NOT NULL,
    loss_rate DECIMAL(5,3) DEFAULT 0,
    has_tracking BOOLEAN DEFAULT true,
    tracking_type VARCHAR(50) DEFAULT 'partial' CHECK (tracking_type IN ('none', 'partial', 'full')),
    insurance_available BOOLEAN DEFAULT false,
    insurance_rate DECIMAL(5,3) DEFAULT 0,
    is_recommended BOOLEAN DEFAULT false,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, country_id, min_weight, max_weight)
);

-- 物流模块索引
CREATE INDEX IF NOT EXISTS idx_logistics_channels_is_active ON logistics_channels(is_active);
CREATE INDEX IF NOT EXISTS idx_logistics_channels_type ON logistics_channels(type);
CREATE INDEX IF NOT EXISTS idx_logistics_quotes_channel_id ON logistics_quotes(channel_id);
CREATE INDEX IF NOT EXISTS idx_logistics_quotes_country_id ON logistics_quotes(country_id);
CREATE INDEX IF NOT EXISTS idx_logistics_quotes_weight ON logistics_quotes(min_weight, max_weight);
CREATE INDEX IF NOT EXISTS idx_logistics_quotes_recommended ON logistics_quotes(is_recommended);

-- 物流模块 RLS
ALTER TABLE logistics_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logistics channels are viewable by everyone" ON logistics_channels FOR SELECT USING (true);

ALTER TABLE logistics_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logistics quotes are viewable by everyone" ON logistics_quotes FOR SELECT USING (true);

-- 物流渠道触发器
CREATE TRIGGER trigger_logistics_channels_update_updated_at
BEFORE UPDATE ON logistics_channels
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_logistics_quotes_update_updated_at
BEFORE UPDATE ON logistics_quotes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入物流渠道数据
INSERT INTO logistics_channels (name, type, company_name, sort_order) VALUES
('中国邮政小包', 'postal', '中国邮政', 10),
('E邮宝', 'postal', '中国邮政', 9),
('中美专线', 'special_line', '万色快递', 8),
('中欧专线', 'special_line', '云途物流', 8),
('中日专线', 'special_line', 'DHL eCommerce', 8),
('DHL Express', 'express', 'DHL', 5),
('FedEx IP', 'express', 'FedEx', 5),
('UPS Expedited', 'express', 'UPS', 4),
('顺丰国际', 'express', '顺丰速运', 6)
ON CONFLICT DO NOTHING;

-- 插入物流报价数据 (美国)
INSERT INTO logistics_quotes (channel_id, country_id, min_weight, max_weight, base_price, price_per_kg, transit_days_min, transit_days_max, loss_rate, has_tracking, tracking_type, is_recommended, notes)
SELECT lc.id, c.id, 0, 0.5, 25.00, 30.00, 10, 20, 0.003, true, 'full', false, '2kg以内小包'
FROM logistics_channels lc, countries c
WHERE lc.name = '中国邮政小包' AND c.code = 'US'
ON CONFLICT DO NOTHING;

INSERT INTO logistics_quotes (channel_id, country_id, min_weight, max_weight, base_price, price_per_kg, transit_days_min, transit_days_max, loss_rate, has_tracking, tracking_type, is_recommended, notes)
SELECT lc.id, c.id, 0.5, 2.0, 35.00, 25.00, 8, 15, 0.002, true, 'full', true, '性价比最优'
FROM logistics_channels lc, countries c
WHERE lc.name = 'E邮宝' AND c.code = 'US'
ON CONFLICT DO NOTHING;

INSERT INTO logistics_quotes (channel_id, country_id, min_weight, max_weight, base_price, price_per_kg, transit_days_min, transit_days_max, loss_rate, has_tracking, tracking_type, is_recommended, notes)
SELECT lc.id, c.id, 0, 30.0, 85.00, 15.00, 5, 8, 0.001, true, 'full', false, '时效稳定'
FROM logistics_channels lc, countries c
WHERE lc.name = '中美专线' AND c.code = 'US'
ON CONFLICT DO NOTHING;

INSERT INTO logistics_quotes (channel_id, country_id, min_weight, max_weight, base_price, price_per_kg, transit_days_min, transit_days_max, loss_rate, has_tracking, tracking_type, is_recommended, notes)
SELECT lc.id, c.id, 0, 30.0, 180.00, 25.00, 3, 5, 0.0005, true, 'full', false, '最快时效'
FROM logistics_channels lc, countries c
WHERE lc.name = 'DHL Express' AND c.code = 'US'
ON CONFLICT DO NOTHING;
