-- 选品相关数据库表设计 (Supabase PostgreSQL)
-- 版本: v1.0
-- 日期: 2026-03-30

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 国家配置表 (目标国家模块)
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL, -- 国家二字码：US/CA/JP等
    name VARCHAR(100) NOT NULL, -- 国家名称
    currency VARCHAR(10) NOT NULL, -- 币种：USD/EUR/JPY等
    currency_symbol VARCHAR(5) NOT NULL, -- 货币符号：$/€/¥等
    language_code VARCHAR(10) NOT NULL, -- 主语言代码：en/ja/es等
    logistics_days_min INTEGER NOT NULL, -- 最小物流时效(天)
    logistics_days_max INTEGER NOT NULL, -- 最大物流时效(天)
    popular_categories TEXT[] DEFAULT '{}'::TEXT[], -- 热门品类数组
    is_active BOOLEAN DEFAULT true, -- 是否启用
    sort_order INTEGER DEFAULT 0, -- 排序权重
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 平台表 (包含来源平台和供货平台)
CREATE TABLE IF NOT EXISTS platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- 平台名称：Amazon/1688/阿里国际站等，唯一
    type VARCHAR(20) NOT NULL CHECK (type IN ('source', 'supplier', 'both')), -- 平台类型：来源/供货/两者都是
    logo_url VARCHAR(500), -- 平台logo地址
    base_url VARCHAR(500), -- 平台主页地址
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 爆款商品主表
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE, -- 所属国家
    title VARCHAR(500) NOT NULL, -- 商品名称
    description TEXT, -- 商品描述
    main_image_url VARCHAR(500) NOT NULL, -- 主图地址
    image_urls TEXT[] DEFAULT '{}'::TEXT[], -- 其他图片地址数组
    source_platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE, -- 来源平台
    source_product_id VARCHAR(200) NOT NULL, -- 来源平台的商品ID
    source_url VARCHAR(500) NOT NULL, -- 来源页面地址
    current_price DECIMAL(10,2) NOT NULL, -- 当前售价(目标国货币)
    original_price DECIMAL(10,2), -- 原价
    sales_volume_7d INTEGER DEFAULT 0, -- 近7天销量
    sales_growth_rate DECIMAL(5,2) DEFAULT 0, -- 近7天销量增长率(%)
    social_mentions_count INTEGER DEFAULT 0, -- 社交平台提及量
    potential_score DECIMAL(5,2) NOT NULL, -- 潜力评分(0-100)
    category VARCHAR(200), -- 品类
    tags TEXT[] DEFAULT '{}'::TEXT[], -- 商品标签
    weight DECIMAL(8,2), -- 重量(kg)
    length DECIMAL(8,2), -- 长度(cm)
    width DECIMAL(8,2), -- 宽度(cm)
    height DECIMAL(8,2), -- 高度(cm)
    seller_count INTEGER DEFAULT 0, -- 卖家数量(竞争度)
    listing_days INTEGER DEFAULT 0, -- 上架天数
    is_duplicate BOOLEAN DEFAULT false, -- 是否是重复商品
    duplicate_of UUID REFERENCES products(id) ON DELETE SET NULL, -- 重复商品的主商品ID
    is_active BOOLEAN DEFAULT true,
    crawled_at TIMESTAMPTZ DEFAULT NOW(), -- 爬取时间
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_id, source_platform_id, source_product_id) -- 同一国家同一平台的同一商品唯一
);

-- 4. 商品价格历史表 (用于价格趋势)
CREATE TABLE IF NOT EXISTS product_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL, -- 价格
    record_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 记录日期
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, record_date) -- 同一商品同一日期只存一条记录
);

-- 5. 供货平台比价表
CREATE TABLE IF NOT EXISTS product_supplier_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE, -- 供货平台
    supplier_product_id VARCHAR(200) NOT NULL, -- 供货平台商品ID
    supplier_url VARCHAR(500) NOT NULL, -- 供货页面地址
    price DECIMAL(10,2) NOT NULL, -- 供货价格(人民币)
    min_order_quantity INTEGER DEFAULT 1, -- 最小起订量
    shipping_price DECIMAL(10,2) DEFAULT 0, -- 供货方国内运费
    delivery_days INTEGER DEFAULT 3, -- 供货方发货时效(天)
    match_confidence DECIMAL(5,2) NOT NULL, -- 匹配度(0-100)
    match_method VARCHAR(50) NOT NULL CHECK (match_method IN ('keyword', 'image', 'both')), -- 匹配方式
    is_best_match BOOLEAN DEFAULT false, -- 是否是最优匹配
    crawled_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, supplier_platform_id, supplier_product_id)
);

-- 6. 用户选品收藏表 (个人选品库)
CREATE TABLE IF NOT EXISTS user_product_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 关联Supabase用户
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_comparison' CHECK (
        status IN (
            'pending_comparison', -- 待比价
            'pending_copywriting', -- 待生成文案
            'pending_shipping', -- 待发货
            'listed' -- 已上架
        )
    ), -- 处理状态
    notes TEXT, -- 用户备注
    profit_estimate DECIMAL(10,2), -- 预估利润
    selected_supplier_price_id UUID REFERENCES product_supplier_prices(id) ON DELETE SET NULL, -- 用户选定的供货渠道
    generated_copy TEXT, -- 生成的营销文案
    selected_logistics_id UUID, -- 选定的物流方案ID(后续物流模块扩展)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id) -- 同一用户同一商品只能收藏一次
);

-- 7. 用户自定义选品标签表
CREATE TABLE IF NOT EXISTS user_product_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- 标签名称
    color VARCHAR(7) DEFAULT '#3b82f6', -- 标签颜色(hex)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name) -- 同一用户标签名唯一
);

-- 8. 选品和标签关联表
CREATE TABLE IF NOT EXISTS user_product_tag_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_favorite_id UUID NOT NULL REFERENCES user_product_favorites(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES user_product_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_favorite_id, tag_id) -- 同一关联唯一
);

-- 9. 爬虫任务管理表
CREATE TABLE IF NOT EXISTS crawl_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE, -- 目标国家
    platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE, -- 爬取平台
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('product_list', 'product_detail', 'price_update')), -- 任务类型
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')), -- 任务状态
    priority INTEGER DEFAULT 5, -- 优先级 1-10，数字越大优先级越高
    target_url VARCHAR(500), -- 爬取目标URL
    params JSONB DEFAULT '{}'::JSONB, -- 任务参数
    total_count INTEGER DEFAULT 0, -- 预期爬取总数
    success_count INTEGER DEFAULT 0, -- 成功爬取数量
    failed_count INTEGER DEFAULT 0, -- 失败数量
    error_message TEXT, -- 错误信息
    started_at TIMESTAMPTZ, -- 开始时间
    finished_at TIMESTAMPTZ, -- 完成时间
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 市场配置表 (每个国家的个性化配置)
CREATE TABLE IF NOT EXISTS market_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL, -- 配置键
    config_value TEXT NOT NULL, -- 配置值
    config_type VARCHAR(20) NOT NULL DEFAULT 'string' CHECK (config_type IN ('string', 'number', 'boolean', 'json')), -- 配置类型
    description TEXT, -- 配置说明
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_id, config_key) -- 同一国家同一配置键唯一
);

-- ==================== 索引优化 ====================
-- 国家表索引
CREATE INDEX IF NOT EXISTS idx_countries_is_active ON countries(is_active);
CREATE INDEX IF NOT EXISTS idx_countries_sort_order ON countries(sort_order);

-- 商品表索引
CREATE INDEX IF NOT EXISTS idx_products_country_id ON products(country_id);
CREATE INDEX IF NOT EXISTS idx_products_potential_score ON products(potential_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_sales_growth_rate ON products(sales_growth_rate DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_crawled_at ON products(crawled_at DESC);

-- 价格历史索引
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON product_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_record_date ON product_price_history(record_date DESC);

-- 供货价格索引
CREATE INDEX IF NOT EXISTS idx_supplier_prices_product_id ON product_supplier_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_prices_best_match ON product_supplier_prices(is_best_match);

-- 用户收藏索引
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_product_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_status ON user_product_favorites(status);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_product_favorites(created_at DESC);

-- 用户标签索引
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON user_product_tags(user_id);

-- 标签关联索引
CREATE INDEX IF NOT EXISTS idx_tag_relations_favorite_id ON user_product_tag_relations(user_favorite_id);
CREATE INDEX IF NOT EXISTS idx_tag_relations_tag_id ON user_product_tag_relations(tag_id);

-- 爬虫任务表索引
CREATE INDEX IF NOT EXISTS idx_crawl_tasks_country_id ON crawl_tasks(country_id);
CREATE INDEX IF NOT EXISTS idx_crawl_tasks_platform_id ON crawl_tasks(platform_id);
CREATE INDEX IF NOT EXISTS idx_crawl_tasks_status ON crawl_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crawl_tasks_priority ON crawl_tasks(priority DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_tasks_created_at ON crawl_tasks(created_at DESC);

-- 市场配置表索引
CREATE INDEX IF NOT EXISTS idx_market_config_country_id ON market_config(country_id);
CREATE INDEX IF NOT EXISTS idx_market_config_key ON market_config(config_key);
CREATE INDEX IF NOT EXISTS idx_market_config_active ON market_config(is_active);

-- ==================== RLS行级安全策略 ====================
-- 国家表：公开可读，管理员可写
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Countries are viewable by everyone" ON countries FOR SELECT USING (true);

-- 平台表：公开可读，管理员可写
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platforms are viewable by everyone" ON platforms FOR SELECT USING (true);

-- 商品表：公开可读，爬虫/管理员可写
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

-- 价格历史表：公开可读
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Price history is viewable by everyone" ON product_price_history FOR SELECT USING (true);

-- 供货价格表：公开可读
ALTER TABLE product_supplier_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supplier prices are viewable by everyone" ON product_supplier_prices FOR SELECT USING (true);

-- 用户收藏表：仅用户自己可读写
ALTER TABLE user_product_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view their own favorites" ON user_product_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can insert their own favorites" ON user_product_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update their own favorites" ON user_product_favorites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete their own favorites" ON user_product_favorites FOR DELETE USING (auth.uid() = user_id);

-- 用户标签表：仅用户自己可读写
ALTER TABLE user_product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view their own tags" ON user_product_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can insert their own tags" ON user_product_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update their own tags" ON user_product_tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete their own tags" ON user_product_tags FOR DELETE USING (auth.uid() = user_id);

-- 标签关联表：仅用户自己可读写
ALTER TABLE user_product_tag_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view their own tag relations" ON user_product_tag_relations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_product_favorites f
        WHERE f.id = user_favorite_id AND f.user_id = auth.uid()
    )
);
CREATE POLICY "User can insert their own tag relations" ON user_product_tag_relations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_product_favorites f
        WHERE f.id = user_favorite_id AND f.user_id = auth.uid()
    )
);
CREATE POLICY "User can delete their own tag relations" ON user_product_tag_relations FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM user_product_favorites f
        WHERE f.id = user_favorite_id AND f.user_id = auth.uid()
    )
);

-- 爬虫任务表：公开可读，管理员/爬虫服务可写
ALTER TABLE crawl_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Crawl tasks are viewable by everyone" ON crawl_tasks FOR SELECT USING (true);

-- 市场配置表：公开可读，管理员可写
ALTER TABLE market_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Market config are viewable by everyone" ON market_config FOR SELECT USING (true);

-- ==================== 自动更新时间触发器 ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要自动更新updated_at的表添加触发器
CREATE TRIGGER trigger_countries_update_updated_at
BEFORE UPDATE ON countries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_platforms_update_updated_at
BEFORE UPDATE ON platforms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_update_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_supplier_prices_update_updated_at
BEFORE UPDATE ON product_supplier_prices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_favorites_update_updated_at
BEFORE UPDATE ON user_product_favorites
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_tags_update_updated_at
BEFORE UPDATE ON user_product_tags
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_crawl_tasks_update_updated_at
BEFORE UPDATE ON crawl_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_market_config_update_updated_at
BEFORE UPDATE ON market_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== 物流模块相关表 (v1.4.0) ====================
-- 11. 物流渠道表
CREATE TABLE IF NOT EXISTS logistics_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- 物流渠道名称：中国邮政小包/e邮宝/DHL/专线等
    type VARCHAR(50) NOT NULL CHECK (type IN ('postal', 'special_line', 'express', 'warehouse')), -- 类型：邮政小包/专线/商业快递/海外仓
    company_name VARCHAR(100) NOT NULL, -- 物流公司名称
    logo_url VARCHAR(500), -- 物流商logo
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0, -- 排序权重
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. 物流报价表 (按国家/重量区间)
CREATE TABLE IF NOT EXISTS logistics_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES logistics_channels(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    min_weight DECIMAL(8,2) NOT NULL, -- 最小重量(kg)
    max_weight DECIMAL(8,2) NOT NULL, -- 最大重量(kg)
    base_price DECIMAL(10,2) NOT NULL, -- 基础价格(人民币)
    price_per_kg DECIMAL(10,2) DEFAULT 0, -- 续重每公斤价格
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY', -- 报价币种
    transit_days_min INTEGER NOT NULL, -- 最小时效(天)
    transit_days_max INTEGER NOT NULL, -- 最大时效(天)
    loss_rate DECIMAL(5,3) DEFAULT 0, -- 丢包率(0-1)
    has_tracking BOOLEAN DEFAULT true, -- 是否可追踪
    tracking_type VARCHAR(50) DEFAULT 'partial' CHECK (tracking_type IN ('none', 'partial', 'full')), -- 追踪类型
    insurance_available BOOLEAN DEFAULT false, -- 是否支持保险
    insurance_rate DECIMAL(5,3) DEFAULT 0, -- 保险费率
    is_recommended BOOLEAN DEFAULT false, -- 是否推荐
    notes TEXT, -- 备注说明
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

-- 插入物流报价数据 (示例数据 - 美国)
-- 注意：需要为每个国家配置对应的报价区间
-- 以下仅为示例，实际使用时需要对接真实API或定期更新
INSERT INTO logistics_quotes (channel_id, country_id, min_weight, max_weight, base_price, price_per_kg, transit_days_min, transit_days_max, loss_rate, has_tracking, tracking_type, is_recommended, notes)
SELECT 
    lc.id,
    c.id,
    0, 0.5, 25.00, 30.00, 10, 20, 0.003, true, 'full', false, '2kg以内小包'
FROM logistics_channels lc, countries c
WHERE lc.name = '中国邮政小包' AND c.code = 'US'
ON CONFLICT DO NOTHING;

INSERT INTO logistics_quotes (channel_id, country_id, min_weight, max_weight, base_price, price_per_kg, transit_days_min, transit_days_max, loss_rate, has_tracking, tracking_type, is_recommended, notes)
SELECT 
    lc.id,
    c.id,
    0.5, 2.0, 35.00, 25.00, 8, 15, 0.002, true, 'full', true, '性价比最优'
FROM logistics_channels lc, countries c
WHERE lc.name = 'E邮宝' AND c.code = 'US'
ON CONFLICT DO NOTHING;

INSERT INTO logistics_quotes (channel_id, country_id, min_weight, max_weight, base_price, price_per_kg, transit_days_min, transit_days_max, loss_rate, has_tracking, tracking_type, is_recommended, notes)
SELECT 
    lc.id,
    c.id,
    0, 30.0, 85.00, 15.00, 5, 8, 0.001, true, 'full', false, '时效稳定'
FROM logistics_channels lc, countries c
WHERE lc.name = '中美专线' AND c.code = 'US'
ON CONFLICT DO NOTHING;

INSERT INTO logistics_quotes (channel_id, country_id, min_weight, max_weight, base_price, price_per_kg, transit_days_min, transit_days_max, loss_rate, has_tracking, tracking_type, is_recommended, notes)
SELECT 
    lc.id,
    c.id,
    0, 30.0, 180.00, 25.00, 3, 5, 0.0005, true, 'full', false, '最快时效'
FROM logistics_channels lc, countries c
WHERE lc.name = 'DHL Express' AND c.code = 'US'
ON CONFLICT DO NOTHING;

-- ==================== 初始数据 ====================
-- 插入主流国家数据
INSERT INTO countries (code, name, currency, currency_symbol, language_code, logistics_days_min, logistics_days_max, popular_categories, sort_order) VALUES
('US', '美国', 'USD', '$', 'en', 7, 15, '{"3C数码", "家居用品", "服饰鞋帽", "美妆个护"}', 1),
('CA', '加拿大', 'CAD', 'C$', 'en', 7, 18, '{"家居用品", "户外装备", "服饰"}', 2),
('GB', '英国', 'GBP', '£', 'en', 5, 12, '{"3C数码", "美妆个护", "服饰"}', 3),
('DE', '德国', 'EUR', '€', 'de', 5, 12, '{"家居用品", "汽车配件", "3C数码"}', 4),
('FR', '法国', 'EUR', '€', 'fr', 5, 12, '{"美妆个护", "服饰", "家居用品"}', 5),
('JP', '日本', 'JPY', '¥', 'ja', 3, 10, '{"3C数码", "动漫周边", "家居用品"}', 6),
('AU', '澳大利亚', 'AUD', 'A$', 'en', 7, 18, '{"户外装备", "家居用品", "服饰"}', 7)
ON CONFLICT (code) DO NOTHING;

-- 插入主流平台数据
INSERT INTO platforms (name, type, base_url) VALUES
('Amazon US', 'source', 'https://www.amazon.com'),
('Amazon UK', 'source', 'https://www.amazon.co.uk'),
('Amazon DE', 'source', 'https://www.amazon.de'),
('Amazon JP', 'source', 'https://www.amazon.co.jp'),
('eBay', 'source', 'https://www.ebay.com'),
('TikTok Shop US', 'source', 'https://www.tiktok.com/shop'),
('Reddit', 'source', 'https://www.reddit.com'),
('1688', 'supplier', 'https://www.1688.com'),
('阿里国际站', 'supplier', 'https://www.alibaba.com'),
('拼多多跨境', 'both', 'https://www.pddglobal.com')
ON CONFLICT (name) DO NOTHING;
