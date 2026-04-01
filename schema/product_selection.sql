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
    name VARCHAR(100) NOT NULL, -- 平台名称：Amazon/1688/阿里国际站等
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
