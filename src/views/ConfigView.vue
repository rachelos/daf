<template>
  <div class="config-view">
    <a-spin :loading="loading" tip="加载配置中..." class="w-full">
      <a-card title="系统配置信息" :bordered="false">
        <template #extra>
          <a-space class="action-buttons" :size="{ xs: 4, sm: 8 }">
            <a-button v-if="!editMode" @click="startEdit" type="primary" size="small">
              <template #icon>
                <icon-edit />
              </template>
              编辑
            </a-button>
            <template v-else>
              <a-button @click="cancelEdit" size="small">
                <template #icon>
                  <icon-close />
                </template>
                取消
              </a-button>
              <!-- <a-button @click="saveConfig" type="primary" :loading="saving">
                <template #icon>
                  <icon-save />
                </template>
                保存配置
              </a-button> -->
              <a-button @click="saveAndReload" type="primary" :loading="reloading" size="small">
                <template #icon>
                  <icon-refresh />
                </template>
                保存
              </a-button>
            </template>
            <a-button v-if="!editMode" @click="restartServer" status="warning" :loading="reloading" size="small">
              <template #icon>
                <icon-refresh />
              </template>
              重启
            </a-button>
            <a-button @click="loadConfig" :loading="loading" size="small">
              <template #icon>
                <icon-refresh />
              </template>
              刷新
            </a-button>
          </a-space>
        </template>


        <!-- 系统信息 -->
        <a-card title="系统信息" class="mb-4" :bordered="false">
          <a-descriptions :column="{ xs: 1, sm: 2 }" bordered>
            <a-descriptions-item label="操作系统">{{ config.system?.os }}</a-descriptions-item>
            <a-descriptions-item label="系统架构">{{ config.system?.arch }}</a-descriptions-item>
            <a-descriptions-item label="CPU 核心数">{{ config.system?.num_cpu }}</a-descriptions-item>
            <a-descriptions-item label="协程数量">{{ config.system?.num_goroutine }}</a-descriptions-item>
          </a-descriptions>
        </a-card>


        <!-- 词库配置 -->
        <a-card title="词库配置" class="mb-4" :bordered="false">
          <a-descriptions v-if="!editMode" :column="{ xs: 1, sm: 1, md: 1, lg: 2 }" bordered>
            <a-descriptions-item label="加载系统词库">
              <a-tag :color="config.dictionary?.load_default_words ? 'green' : 'red'">
                {{ config.dictionary?.load_default_words ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="外部词库目录">
              <span class="mobile-break-word">{{ config.dictionary?.external_word_dir || '未配置' }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="纠错词库目录">
              <span class="mobile-break-word">{{ config.dictionary?.correction_word_dir || '未配置' }}</span>
            </a-descriptions-item>
          </a-descriptions>
          <a-form v-else :model="editConfig" layout="vertical">
            <a-row :gutter="{ xs: 8, sm: 16 }">
              <a-col :span="24">
                <a-form-item label="加载系统词库">
                  <a-switch v-model="editConfig.dictionary.load_default_words" />
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item label="外部词库目录">
                  <a-input v-model="editConfig.dictionary.external_word_dir" placeholder="外部词库目录路径" />
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item label="纠错词库目录">
                  <a-input v-model="editConfig.dictionary.correction_word_dir" placeholder="纠错词库目录路径" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <!-- 检测配置 -->
        <a-card title="检测配置" class="mb-4" :bordered="false">
          <a-descriptions v-if="!editMode" :column="{ xs: 1, sm: 2, md: 6 }" bordered>
            <a-descriptions-item label="忽略大小写">
              <a-tag :color="config.detection?.ignore_case ? 'green' : 'red'">
                {{ config.detection?.ignore_case ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="忽略全角/半角">
              <a-tag :color="config.detection?.ignore_width ? 'green' : 'red'">
                {{ config.detection?.ignore_width ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="忽略数字样式">
              <a-tag :color="config.detection?.ignore_num_style ? 'green' : 'red'">
                {{ config.detection?.ignore_num_style ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="检测连续数字">
              <a-tag :color="config.detection?.enable_num_check ? 'green' : 'red'">
                {{ config.detection?.enable_num_check ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="检测 URL">
              <a-tag :color="config.detection?.enable_url_check ? 'green' : 'red'">
                {{ config.detection?.enable_url_check ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="检测 Email">
              <a-tag :color="config.detection?.enable_email_check ? 'green' : 'red'">
                {{ config.detection?.enable_email_check ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="忽略空白字符">
              <a-tag :color="config.detection?.skip_whitespace ? 'green' : 'red'">
                {{ config.detection?.skip_whitespace ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="最大字符距离">{{ config.detection?.max_distance }}</a-descriptions-item>
            <a-descriptions-item label="拼音检测">
              <a-tag :color="config.detection?.enable_pinyin ? 'green' : 'red'">
                {{ config.detection?.enable_pinyin ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="同音字检测">
              <a-tag :color="config.detection?.enable_homophone ? 'green' : 'red'">
                {{ config.detection?.enable_homophone ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="形近字检测">
              <a-tag :color="config.detection?.enable_similar_shape ? 'green' : 'red'">
                {{ config.detection?.enable_similar_shape ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="异体字检测">
              <a-tag :color="config.detection?.enable_variant_form ? 'green' : 'red'">
                {{ config.detection?.enable_variant_form ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="中文拼音混合检测">
              <a-tag :color="config.detection?.enable_zh_py_mix ? 'green' : 'red'">
                {{ config.detection?.enable_zh_py_mix ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="通配符检测">
              <a-tag :color="config.detection?.enable_wildcard ? 'green' : 'red'">
                {{ config.detection?.enable_wildcard ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
          <a-form v-else :model="editConfig" layout="vertical">
            <a-row :gutter="{ xs: 8, sm: 16 }">
              <a-col :xs="12" :sm="6">
                <a-form-item label="忽略大小写">
                  <a-switch v-model="editConfig.detection.ignore_case" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="忽略全角/半角">
                  <a-switch v-model="editConfig.detection.ignore_width" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="忽略数字样式">
                  <a-switch v-model="editConfig.detection.ignore_num_style" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="检测连续数字">
                  <a-switch v-model="editConfig.detection.enable_num_check" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="检测 URL">
                  <a-switch v-model="editConfig.detection.enable_url_check" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="检测 Email">
                  <a-switch v-model="editConfig.detection.enable_email_check" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="忽略空白字符">
                  <a-switch v-model="editConfig.detection.skip_whitespace" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="最大字符距离">
                  <a-input-number v-model="editConfig.detection.max_distance" :min="0" :max="10" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="拼音检测">
                  <a-switch v-model="editConfig.detection.enable_pinyin" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="同音字检测">
                  <a-switch v-model="editConfig.detection.enable_homophone" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="形近字检测">
                  <a-switch v-model="editConfig.detection.enable_similar_shape" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="异体字检测">
                  <a-switch v-model="editConfig.detection.enable_variant_form" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="中文拼音混合检测">
                  <a-switch v-model="editConfig.detection.enable_zh_py_mix" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="通配符检测">
                  <a-switch v-model="editConfig.detection.enable_wildcard" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <!-- 分类配置 -->
        <a-card title="分类配置" class="mb-4" :bordered="false">
          <a-descriptions v-if="!editMode" :column="{ xs: 1, sm: 1, md: 1, lg: 2 }" bordered>
            <a-descriptions-item label="使用预定义分类">
              <a-tag :color="config.categories_config?.use_predefined !== false ? 'green' : 'red'">
                {{ config.categories_config?.use_predefined !== false ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="自定义分类">
              <a-space wrap class="custom-categories-tags">
                <a-tag v-for="(name, key) in config.categories_config?.custom_categories" :key="key" color="arcoblue">
                  {{ key }}: {{ name }}
                </a-tag>
              </a-space>
            </a-descriptions-item>
          </a-descriptions>
          <a-form v-else :model="editConfig" layout="vertical">
            <a-row :gutter="{ xs: 8, sm: 16 }">
              <a-col :span="24">
                <a-form-item label="使用预定义分类">
                  <a-switch v-model="editConfig.categories_config.use_predefined" />
                  <template #extra>
                    启用时将使用预定义分类，自定义分类作为扩展；禁用时将完全使用自定义分类
                  </template>
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item label="自定义分类">
                  <template #extra>
                    每行输入格式：分类键名=分类显示名称（例如：custom=自定义分类）
                  </template>
                  <a-textarea
                    v-model="categoriesText"
                    :auto-size="{ minRows: 6, maxRows: 12 }"
                    placeholder="pornography=色情&#10;political=政治&#10;violence=暴力"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <!-- 纠错配置 -->
        <a-card title="纠错配置" class="mb-4" :bordered="false">
          <a-descriptions v-if="!editMode" :column="1" bordered>
            <a-descriptions-item label="跳过敏感词检测">
              <a-tag :color="config.correction?.skip_sensitive_check ? 'green' : 'red'">
                {{ config.correction?.skip_sensitive_check ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="允许纠错分类">
              {{ config.correction?.allowed_categories || '所有分类' }}
            </a-descriptions-item>
          </a-descriptions>
          <a-form v-else :model="editConfig" layout="vertical">
            <a-row :gutter="{ xs: 8, sm: 16 }">
              <a-col :xs="24" :sm="12">
                <a-form-item label="跳过敏感词检测">
                  <a-switch v-model="editConfig.correction.skip_sensitive_check" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item label="允许纠错分类">
                  <a-input v-model="editConfig.correction.allowed_categories" placeholder="用逗号分隔分类名称" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <!-- 级联配置 -->
        <a-card title="级联配置" class="mb-4" :bordered="false">
          <a-descriptions v-if="!editMode" :column="{ xs: 1, sm: 2, md: 3 }" bordered>
            <a-descriptions-item label="启用级联">
              <a-tag :color="config.cascade?.enabled ? 'green' : 'red'">
                {{ config.cascade?.enabled ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="上级系统端点">{{ config.cascade?.endpoint || '-' }}</a-descriptions-item>
            <a-descriptions-item label="请求超时">{{ config.cascade?.timeout || 10 }}秒</a-descriptions-item>
            <a-descriptions-item label="级联模式">
              <a-tag v-if="config.cascade?.mode === 'priority'" color="blue">优先使用上级</a-tag>
              <a-tag v-else-if="config.cascade?.mode === 'fallback'" color="orange">本地优先回退</a-tag>
              <a-tag v-else>-</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="本地缓存">
              <a-tag :color="config.cascade?.local_cache ? 'green' : 'red'">
                {{ config.cascade?.local_cache ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="Access Key">
              <span v-if="config.cascade?.access_key">••••••••</span>
              <span v-else>未配置</span>
            </a-descriptions-item>
          </a-descriptions>
          <a-form v-else :model="editConfig" layout="vertical">
            <a-row :gutter="{ xs: 8, sm: 16 }">
              <a-col :xs="24" :sm="6">
                <a-form-item label="启用级联">
                  <a-switch v-model="editConfig.cascade.enabled" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item label="上级系统端点">
                  <a-input v-model="editConfig.cascade.endpoint" placeholder="http://host:port" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="请求超时">
                  <a-input-number v-model="editConfig.cascade.timeout" :min="1" :max="60" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="级联模式">
                  <a-select v-model="editConfig.cascade.mode" placeholder="选择级联模式">
                    <a-option value="priority">优先使用上级</a-option>
                    <a-option value="fallback">本地优先回退</a-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="本地缓存">
                  <a-switch v-model="editConfig.cascade.local_cache" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="Access Key">
                  <a-input-password v-model="editConfig.cascade.access_key" placeholder="Access Key" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="6">
                <a-form-item label="Secret Key">
                  <a-input-password v-model="editConfig.cascade.secret_key" placeholder="Secret Key" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <!-- AI检测配置 -->
        <a-card title="AI检测配置" class="mb-4" :bordered="false">
          <a-descriptions v-if="!editMode" :column="{ xs: 1, sm: 2, md: 3 }" bordered>
            <a-descriptions-item label="启用AI检测">
              <a-tag :color="config.ai?.enabled ? 'green' : 'red'">
                {{ config.ai?.enabled ? '是' : '否' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="AI提供商">{{ config.ai?.provider || '-' }}</a-descriptions-item>
            <a-descriptions-item label="模型">{{ config.ai?.model || '-' }}</a-descriptions-item>
            <a-descriptions-item label="API端点">{{ config.ai?.endpoint || '默认' }}</a-descriptions-item>
            <a-descriptions-item label="最大Tokens">{{ config.ai?.max_tokens || 1000 }}</a-descriptions-item>
            <a-descriptions-item label="温度参数">{{ config.ai?.temperature || 0.3 }}</a-descriptions-item>
            <a-descriptions-item label="请求超时">{{ config.ai?.timeout || 30 }}秒</a-descriptions-item>
            <a-descriptions-item label="判定阈值">{{ config.ai?.threshold || 0.7 }}</a-descriptions-item>
            <a-descriptions-item label="API密钥">
              <span v-if="config.ai?.api_key">••••••••</span>
              <span v-else>未配置</span>
            </a-descriptions-item>
          </a-descriptions>
          <a-form v-else :model="editConfig" layout="vertical">
            <a-row :gutter="{ xs: 8, sm: 16 }">
              <a-col :xs="24" :sm="6">
                <a-form-item label="启用AI检测">
                  <a-switch v-model="editConfig.ai.enabled" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="AI提供商">
                  <a-select v-model="editConfig.ai.provider" placeholder="选择提供商">
                    <a-option value="openai">OpenAI</a-option>
                    <a-option value="anthropic">Anthropic</a-option>
                    <a-option value="custom">自定义</a-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="模型">
                  <a-input v-model="editConfig.ai.model" placeholder="模型名称" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="6">
                <a-form-item label="API端点">
                  <a-input v-model="editConfig.ai.endpoint" placeholder="自定义API端点" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="API密钥">
                  <a-input-password v-model="editConfig.ai.api_key" placeholder="API密钥" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="最大Tokens">
                  <a-input-number v-model="editConfig.ai.max_tokens" :min="100" :max="4000" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="温度参数">
                  <a-input-number v-model="editConfig.ai.temperature" :min="0" :max="2" :step="0.1" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="请求超时">
                  <a-input-number v-model="editConfig.ai.timeout" :min="5" :max="120" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="6">
                <a-form-item label="判定阈值">
                  <a-input-number v-model="editConfig.ai.threshold" :min="0" :max="1" :step="0.1" style="width: 100%" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <!-- 服务器配置 -->
        <a-card title="服务器配置" class="mb-4" :bordered="false">
          <a-descriptions v-if="!editMode" :column="1" bordered>
            <a-descriptions-item label="服务端口">{{ config.server?.port }}</a-descriptions-item>
            <a-descriptions-item label="数据库类型">{{ config.server?.user_db?.type || 'sqlite' }}</a-descriptions-item>
            <a-descriptions-item label="数据库路径/连接">
              <template v-if="config.server?.user_db?.sqlite">
                {{ config.server?.user_db?.sqlite?.path }}
              </template>
              <template v-else-if="config.server?.user_db?.mysql">
                {{ config.server?.user_db?.mysql?.host }}:{{ config.server?.user_db?.mysql?.port }}/{{ config.server?.user_db?.mysql?.database }}
              </template>
              <template v-else-if="config.server?.user_db?.postgres">
                {{ config.server?.user_db?.postgres?.host }}:{{ config.server?.user_db?.postgres?.port }}/{{ config.server?.user_db?.postgres?.database }}
              </template>
              <template v-else>
                默认 (./data/users.db)
              </template>
            </a-descriptions-item>
          </a-descriptions>
          <a-form v-else :model="editConfig" layout="vertical">
            <a-row :gutter="{ xs: 8, sm: 16 }">
              <a-col :xs="12" :sm="8">
                <a-form-item label="服务端口">
                  <a-input-number v-model="editConfig.server.port" :min="1024" :max="65535" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :sm="8">
                <a-form-item label="数据库类型">
                  <a-select v-model="editConfig.server.user_db.type" placeholder="选择数据库类型">
                    <a-option value="sqlite">SQLite</a-option>
                    <a-option value="mysql">MySQL</a-option>
                    <a-option value="postgres">PostgreSQL</a-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" v-if="editConfig.server.user_db?.type === 'sqlite'">
                <a-form-item label="数据库路径">
                  <a-input v-model="editConfig.server.user_db.sqlite.path" placeholder="SQLite数据库文件路径" />
                </a-form-item>
              </a-col>
              <template v-if="editConfig.server.user_db?.type === 'mysql'">
                <a-col :xs="24" :sm="12">
                  <a-form-item label="主机地址">
                    <a-input v-model="editConfig.server.user_db.mysql.host" placeholder="MySQL主机地址" />
                  </a-form-item>
                </a-col>
                <a-col :xs="12" :sm="6">
                  <a-form-item label="端口">
                    <a-input-number v-model="editConfig.server.user_db.mysql.port" :min="1" :max="65535" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :xs="12" :sm="6">
                  <a-form-item label="数据库名">
                    <a-input v-model="editConfig.server.user_db.mysql.database" placeholder="数据库名称" />
                  </a-form-item>
                </a-col>
                <a-col :xs="12" :sm="6">
                  <a-form-item label="用户名">
                    <a-input v-model="editConfig.server.user_db.mysql.username" placeholder="MySQL用户名" />
                  </a-form-item>
                </a-col>
                <a-col :xs="12" :sm="6">
                  <a-form-item label="密码">
                    <a-input-password v-model="editConfig.server.user_db.mysql.password" placeholder="MySQL密码" />
                  </a-form-item>
                </a-col>
              </template>
              <template v-if="editConfig.server.user_db?.type === 'postgres'">
                <a-col :xs="24" :sm="12">
                  <a-form-item label="主机地址">
                    <a-input v-model="editConfig.server.user_db.postgres.host" placeholder="PostgreSQL主机地址" />
                  </a-form-item>
                </a-col>
                <a-col :xs="12" :sm="6">
                  <a-form-item label="端口">
                    <a-input-number v-model="editConfig.server.user_db.postgres.port" :min="1" :max="65535" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :xs="12" :sm="6">
                  <a-form-item label="数据库名">
                    <a-input v-model="editConfig.server.user_db.postgres.database" placeholder="数据库名称" />
                  </a-form-item>
                </a-col>
                <a-col :xs="12" :sm="6">
                  <a-form-item label="用户名">
                    <a-input v-model="editConfig.server.user_db.postgres.username" placeholder="PostgreSQL用户名" />
                  </a-form-item>
                </a-col>
                <a-col :xs="12" :sm="6">
                  <a-form-item label="密码">
                    <a-input-password v-model="editConfig.server.user_db.postgres.password" placeholder="PostgreSQL密码" />
                  </a-form-item>
                </a-col>
              </template>
            </a-row>
          </a-form>
        </a-card>

        <!-- 加密配置 -->
        <a-card title="加密配置" class="mb-4" :bordered="false">
          <a-descriptions v-if="!editMode" :column="1" bordered>
            <a-descriptions-item label="加密状态">
              <a-tag :color="config.encryption?.enabled ? 'green' : 'red'">
                {{ config.encryption?.enabled ? '已启用' : '未启用' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="加密算法" v-if="config.encryption?.enabled">
              {{ config.encryption?.algorithm || 'AES-256-CBC' }}
            </a-descriptions-item>
            <a-descriptions-item label="密钥长度" v-if="config.encryption?.enabled">
              32 字节 (256位)
            </a-descriptions-item>
            <a-descriptions-item label="密钥状态" v-if="config.encryption?.enabled">
              <a-tag color="blue">已配置</a-tag>
            </a-descriptions-item>
          </a-descriptions>
          <a-form v-else :model="editConfig" layout="vertical">
            <a-row :gutter="{ xs: 8, sm: 16 }">
              <a-col :span="24">
                <a-form-item label="启用加密传输" extra="启用后，所有API请求和响应都将使用AES-256-CBC加密">
                  <a-switch v-model="editConfig.encryption.enabled" />
                </a-form-item>
              </a-col>
              <a-col :span="24" v-if="editConfig.encryption?.enabled">
                <a-form-item label="加密密钥" extra="32字节Base64编码的密钥，用于AES-256-CBC加密">
                  <a-input-password v-model="editConfig.encryption.key" placeholder="输入加密密钥" />
                </a-form-item>
              </a-col>
              <a-col :span="24" v-if="editConfig.encryption?.enabled">
                <a-form-item label="加密算法">
                  <a-input v-model="editConfig.encryption.algorithm" disabled placeholder="AES-256-CBC" />
                </a-form-item>
              </a-col>
              <a-col :span="24" v-if="editConfig.encryption?.enabled">
                <a-form-item>
                  <a-button type="primary" @click="generateEncryptionKey" size="small">
                    <template #icon>
                      <icon-refresh />
                    </template>
                    生成新密钥
                  </a-button>
                  <span class="ml-2 text-gray-500">注意：生成新密钥后需要刷新前端页面</span>
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import {
  IconRefresh,
  IconEdit,
  IconSave,
  IconClose
} from '@arco-design/web-vue/es/icon';
import { configApi } from '@/api';

interface ConfigData {
  system?: {
    go_version: string;
    os: string;
    arch: string;
    num_cpu: number;
    num_goroutine: number;
  };
  dictionary?: any;
  detection?: any;
  correction?: any;
  ai?: any;
  cascade?: any;
  server?: any;
  encryption?: {
    enabled: boolean;
    key: string;
    algorithm: string;
  };
  categories?: Array<{ key: string; name: string; value: string }>;
  categories_config?: {
    use_predefined: boolean;
    custom_categories: Record<string, string>;
  };
  word_count?: number;
  category_stats?: Record<string, number>;
}

const config = ref<ConfigData>({});
const editConfig = ref<ConfigData>({});
const loading = ref(false);
const editMode = ref(false);
const saving = ref(false);
const reloading = ref(false);
const categoriesText = ref('');

// 分类列配置（预留）
// const categoryColumns = [
//   { title: '分类键', dataIndex: 'key', slotName: 'categoryKey', width: 120 },
//   { title: '分类名称', dataIndex: 'name', slotName: 'categoryName' },
//   { title: '分类值', dataIndex: 'value', slotName: 'categoryValue', width: 120 },
// ];

const loadConfig = async () => {
  loading.value = true;
  try {
    const result = await configApi.get();
    if (result.success && result.data) {
      config.value = result.data;
    } else {
      Message.error('获取配置失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('获取配置失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

const startEdit = () => {
  // 深拷贝配置到编辑对象
  editConfig.value = JSON.parse(JSON.stringify(config.value));

  // 初始化encryption
  if (!editConfig.value.encryption) {
    editConfig.value.encryption = {
      enabled: false,
      key: '',
      algorithm: 'AES-256-CBC'
    };
  }

  // 初始化categories_config
  if (!editConfig.value.categories_config) {
    editConfig.value.categories_config = {
      use_predefined: true,
      custom_categories: {}
    };
  }
  
  // 将categories_config转换为文本格式
  if (config.value.categories_config?.custom_categories) {
    categoriesText.value = Object.entries(config.value.categories_config.custom_categories)
      .map(([key, name]) => `${key}=${name}`)
      .join('\n');
  } else if (config.value.categories && Array.isArray(config.value.categories)) {
    // 备用：从categories数组转换
    const customCategories: Record<string, string> = {};
    config.value.categories.forEach(cat => {
      customCategories[cat.key] = cat.name;
    });
    editConfig.value.categories_config.custom_categories = customCategories;
    
    categoriesText.value = config.value.categories
      .map(cat => `${cat.key}=${cat.name}`)
      .join('\n');
  }
  
  editMode.value = true;
  Message.info('已进入编辑模式');
};

const cancelEdit = () => {
  editConfig.value = {};
  editMode.value = false;
  categoriesText.value = '';
  Message.info('已取消编辑');
};

const saveConfig = async () => {
  saving.value = true;
  try {
    // 将categories文本转换为对象
    if (categoriesText.value) {
      const customCategories: Record<string, string> = {};
      const lines = categoriesText.value.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        const [key, ...nameParts] = trimmedLine.split('=');
        if (key && nameParts.length > 0) {
          customCategories[key.trim()] = nameParts.join('=').trim();
        }
      }
      editConfig.value.categories_config = {
        use_predefined: editConfig.value.categories_config?.use_predefined ?? true,
        custom_categories: customCategories
      };
    }

    // 调试：输出保存的配置
    console.log('=== 保存配置 ===');
    console.log('完整配置:', JSON.stringify(editConfig.value, null, 2));
    console.log('加密配置:', JSON.stringify(editConfig.value.encryption, null, 2));

    const result = await configApi.update(editConfig.value);
    if (result.success) {
      Message.success(result.message || '配置保存成功');
      // 重新加载配置
      await loadConfig();
      editMode.value = false;
      editConfig.value = {};
      categoriesText.value = '';
    } else {
      Message.error('保存配置失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('保存配置失败: ' + (error.message || '未知错误'));
  } finally {
    saving.value = false;
  }
};

const saveAndReload = async () => {
  saving.value = true;
  try {
    // 将categories文本转换为对象
    if (categoriesText.value) {
      const customCategories: Record<string, string> = {};
      const lines = categoriesText.value.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        const [key, ...nameParts] = trimmedLine.split('=');
        if (key && nameParts.length > 0) {
          customCategories[key.trim()] = nameParts.join('=').trim();
        }
      }
      editConfig.value.categories_config = {
        use_predefined: editConfig.value.categories_config?.use_predefined ?? true,
        custom_categories: customCategories
      };
    }
    
    const result = await configApi.update(editConfig.value);
    if (!result.success) {
      Message.error('保存配置失败: ' + (result.message || '未知错误'));
      saving.value = false;
      return;
    }

    // 重新加载配置
    reloading.value = true;
    try {
      const reloadResult = await configApi.reloadConfig();
      if (reloadResult.success) {
        Message.success(reloadResult.message || '配置已保存并重新加载');
        // 重新加载配置显示
        await loadConfig();
        editMode.value = false;
        editConfig.value = {};
        categoriesText.value = '';
      } else {
        Message.error('重新加载配置失败: ' + (reloadResult.message || '未知错误'));
      }
    } catch (error: any) {
      Message.error('重新加载配置失败: ' + (error.message || '未知错误'));
    } finally {
      reloading.value = false;
      saving.value = false;
    }
  } catch (error: any) {
    Message.error('保存配置失败: ' + (error.message || '未知错误'));
    saving.value = false;
  }
};

const restartServer = () => {
  Modal.confirm({
    title: '确认重启',
    content: '重启后服务器将短暂不可用，是否继续？',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      reloading.value = true;
      try {
        const result = await configApi.restart();
        if (result.success) {
          Message.success(result.message || '服务器正在重启中...');
          // 延迟后刷新页面
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          Message.error('重启失败: ' + (result.message || '未知错误'));
        }
      } catch (error: any) {
        Message.error('重启失败: ' + (error.message || '未知错误'));
      } finally {
        reloading.value = false;
      }
    },
  });
};

const generateEncryptionKey = () => {
  // 生成32字节随机密钥
  const array = new Uint8Array(32);
  if (window.crypto && window.crypto.getRandomValues) {
    // 使用Web Crypto API生成安全的随机数
    window.crypto.getRandomValues(array);
  } else {
    // 降级方案：使用Math.random（不安全，仅作后备）
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  // 转换为Base64
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(array)));
  editConfig.value.encryption.key = base64;
  Message.success('已生成新密钥，请保存配置');
};

onMounted(() => {
  loadConfig();
});
</script>

<style scoped lang="less">
.config-view {
  margin: 0 auto;
  :deep(.arco-card) {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
  }

  :deep(.arco-card-header) {
    padding: 16px 20px;
  }

  :deep(.arco-card-body) {
    padding: 20px;
  }

  :deep(.arco-btn) {
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  :deep(.arco-statistic) {
    .arco-statistic-title {
      color: var(--color-text-2);
      font-size: 14px;
    }
    .arco-statistic-content {
      color: var(--color-text-1);
      font-size: 24px;
      font-weight: 500;
    }
    .arco-statistic-prefix {
      margin-right: 8px;
    }
  }

  .category-stat-card {
    margin-bottom: 16px;

    :deep(.arco-card-body) {
      padding: 16px;
    }

    :deep(.arco-statistic-title) {
      font-size: 12px;
      margin-bottom: 4px;
    }

    :deep(.arco-statistic-content) {
      font-size: 20px;
    }
  }

  .mb-4 {
    margin-bottom: 16px;
  }

  :deep(.arco-descriptions-item-label) {
    font-weight: 500;
    width: 150px;
    text-align: right;
  }

  :deep(.arco-tag) {
    border-radius: 4px;
    padding: 0 8px;
  }

  :deep(code) {
    background-color: var(--color-fill-2);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }

  .mobile-break-word {
    word-break: break-word;
    word-wrap: break-word;
  }
}

// 分类颜色映射
.category-pornography { border-left: 4px solid #f53f3f; }
.category-political { border-left: 4px solid #ff7d00; }
.category-violence { border-left: 4px solid #fadc19; }
.category-gambling { border-left: 4px solid #9fdb1d; }
.category-drugs { border-left: 4px solid #00b42a; }
.category-profanity { border-left: 4px solid #3491fa; }
.category-discrimination { border-left: 4px solid #722ed1; }
.category-scam { border-left: 4px solid #d91ad9; }
.category-advertisement { border-left: 4px solid #86909c; }
.category-illegalurl { border-left: 4px solid #373c43; }

// 移动端适配
@media (max-width: 768px) {
  .config-view {
    .action-buttons {
      position: static !important;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    :deep(.arco-card) {
      border-radius: 0;
      box-shadow: none;
      border-bottom: 1px solid var(--color-border-2);
    }

    :deep(.arco-card-header) {
      padding: 12px 12px;
      font-size: 16px;
      min-height: 48px;
      display: flex;
      align-items: center;
    }

    :deep(.arco-card-header-title) {
      font-size: 15px;
      font-weight: 500;
    }

    :deep(.arco-card-body) {
      padding: 12px 12px;
    }

    :deep(.arco-descriptions) {
      .arco-descriptions-item-label {
        width: auto !important;
        text-align: left;
        min-width: 90px;
        font-size: 13px;
        flex-shrink: 0;
      }

      .arco-descriptions-item-value {
        word-break: break-word;
        font-size: 13px;
      }
    }

    :deep(.arco-descriptions-item) {
      display: flex;
      flex-direction: column;
      padding: 10px 0 !important;
      border-bottom: 1px solid var(--color-border-2);

      &:last-child {
        border-bottom: none;
      }
    }

    :deep(.arco-descriptions-item-label) {
      margin-bottom: 4px;
      font-weight: 500;
      color: var(--color-text-2);
    }

    :deep(.arco-descriptions-item-value) {
      margin-left: 0 !important;
    }

    :deep(.arco-form-item) {
      margin-bottom: 10px;

      .arco-form-item-label-col {
        padding-bottom: 4px;
      }

      .arco-form-item-label {
        font-size: 13px;
      }
    }

    :deep(.arco-btn) {
      font-size: 12px;
      padding: 4px 10px;
      height: auto;
      min-height: 28px;
    }

    :deep(.arco-input),
    :deep(.arco-select) {
      font-size: 13px;
    }

    :deep(.arco-input-wrapper) {
      padding: 4px 8px;
    }

    :deep(.arco-switch) {
      transform: scale(0.85);
    }

    :deep(.arco-textarea) {
      font-size: 13px;
    }

    :deep(.arco-tag) {
      font-size: 12px;
      padding: 2px 6px;
      margin: 2px;
    }

    .custom-categories-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .mb-4 {
      margin-bottom: 0;
    }
  }
}

@media (max-width: 480px) {
  .config-view {
    .action-buttons {
      :deep(.arco-btn) {
        padding: 3px 8px;
        font-size: 11px;
        min-height: 26px;
      }
    }

    :deep(.arco-card-header) {
      padding: 10px 10px;
      font-size: 14px;
    }

    :deep(.arco-card-body) {
      padding: 10px 10px;
    }

    :deep(.arco-btn) {
      padding: 3px 8px;
      font-size: 11px;
      min-height: 26px;
    }

    :deep(.arco-tag) {
      font-size: 11px;
      padding: 2px 5px;
    }

    :deep(.arco-form-item-label) {
      font-size: 12px;
    }

    :deep(.arco-input),
    :deep(.arco-select) {
      font-size: 12px;
    }
  }
}
</style>
