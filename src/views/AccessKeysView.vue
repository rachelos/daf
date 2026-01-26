<template>
  <div class="access-keys-view">
    <a-card title="Access Key管理" :bordered="false">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="showCreateModal">
            <template #icon>
              <icon-plus />
            </template>
            创建AK
          </a-button>
        </a-space>
      </template>

      <a-alert type="info" :show-icon="true" style="margin-bottom: 16px">
        Access Key用于API调用认证，请妥善保管Secret Key，它只会在创建时显示一次。
      </a-alert>

      <a-table :data="accessKeys" :loading="loading" :pagination="false">
        <template #columns>
          <a-table-column title="名称" data-index="name" />
          <a-table-column title="Access Key" data-index="access_key">
            <template #cell="{ record }">
              <span style="font-family: monospace; font-size: 12px">{{ record.access_key }}</span>
            </template>
          </a-table-column>
          <a-table-column title="描述" data-index="description">
            <template #cell="{ record }">
              {{ record.description || '-' }}
            </template>
          </a-table-column>
          <a-table-column title="状态" data-index="is_active" width="80">
            <template #cell="{ record }">
              <a-tag :color="record.is_active ? 'green' : 'red'">
                {{ record.is_active ? '启用' : '禁用' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="速率限制" data-index="rate_limit" width="100">
            <template #cell="{ record }">
              {{ record.rate_limit }}/分钟
            </template>
          </a-table-column>
          <a-table-column title="过期时间" data-index="expires_at" width="140">
            <template #cell="{ record }">
              {{ formatDateTime(record.expires_at) || '永不过期' }}
            </template>
          </a-table-column>
          <a-table-column title="最后使用" data-index="last_used_at" width="140">
            <template #cell="{ record }">
              {{ formatDateTime(record.last_used_at) || '从未使用' }}
            </template>
          </a-table-column>
          <a-table-column title="创建时间" data-index="created_at" width="140">
            <template #cell="{ record }">
              {{ formatDateTime(record.created_at) }}
            </template>
          </a-table-column>
          <a-table-column title="操作" width="200">
            <template #cell="{ record }">
              <a-space>
                <a-button
                  v-if="record.is_active"
                  type="text"
                  size="small"
                  status="warning"
                  @click="handleDisable(record.id)"
                >
                  <template #icon>
                    <icon-pause />
                  </template>
                  禁用
                </a-button>
                <a-button
                  v-else
                  type="text"
                  size="small"
                  @click="handleEnable(record.id)"
                >
                  <template #icon>
                    <icon-play-arrow />
                  </template>
                  启用
                </a-button>
                <a-button type="text" size="small" @click="handleEdit(record)">
                  <template #icon>
                    <icon-edit />
                  </template>
                  编辑
                </a-button>
                <a-popconfirm
                  content="确定要删除这个Access Key吗？此操作不可撤销。"
                  @ok="handleDelete(record.id)"
                >
                  <a-button type="text" size="small" status="danger">
                    <template #icon>
                      <icon-delete />
                    </template>
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- 创建AK弹窗 -->
    <a-modal
      v-model:visible="createModalVisible"
      title="创建Access Key"
      @ok="handleCreate"
      @cancel="resetCreateForm"
      :ok-loading="createLoading"
      :width="600"
    >
      <a-form :model="createForm" layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model="createForm.name" placeholder="请输入AK名称，如：生产环境API调用" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model="createForm.description" placeholder="请输入描述信息" :rows="3" />
        </a-form-item>
        <a-form-item label="权限配置">
          <a-table :data="createForm.permissions" :pagination="false" size="small">
            <template #columns>
              <a-table-column title="资源" width="120">
                <template #cell="{ rowIndex }">
                  <a-select v-model="createForm.permissions[rowIndex].resource" style="width: 100%">
                    <a-option value="detect">敏感词检测</a-option>
                    <a-option value="filter">文本过滤</a-option>
                    <a-option value="correction">文本纠错</a-option>
                    <a-option value="word">词汇管理</a-option>
                    <a-option value="*">所有资源</a-option>
                  </a-select>
                </template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell="{ rowIndex }">
                  <a-select v-model="createForm.permissions[rowIndex].actions" multiple style="width: 100%">
                    <a-option value="read">读取</a-option>
                    <a-option value="write">写入</a-option>
                    <a-option value="update">更新</a-option>
                    <a-option value="delete">删除</a-option>
                    <a-option value="*">所有操作</a-option>
                  </a-select>
                </template>
              </a-table-column>
              <a-table-column title="操作" width="60">
                <template #cell="{ rowIndex }">
                  <a-button type="text" size="small" status="danger" @click="removePermission(rowIndex)">
                    <icon-minus />
                  </a-button>
                </template>
              </a-table-column>
            </template>
          </a-table>
          <a-button type="text" size="small" @click="addPermission" style="margin-top: 8px">
            <template #icon>
              <icon-plus />
            </template>
            添加权限
          </a-button>
        </a-form-item>
        <a-form-item label="IP白名单">
          <a-textarea
            v-model="ipWhitelistText"
            placeholder="每行一个IP地址，支持CIDR格式（如：192.168.1.0/24）&#10;留空表示允许所有IP访问"
            :rows="4"
          />
        </a-form-item>
        <a-form-item label="速率限制（每分钟）" required>
          <a-input-number v-model="createForm.rate_limit" :min="1" :max="10000" style="width: 100%" />
        </a-form-item>
        <a-form-item label="过期时间">
          <a-date-picker v-model="createForm.expires_at" show-time style="width: 100%" />
          <template #extra>不选择表示永不过期</template>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 显示Secret Key弹窗 -->
    <a-modal v-model:visible="secretKeyModalVisible" title="Access Key创建成功" :footer="false" :closable="false">
      <a-alert type="warning" :show-icon="true" style="margin-bottom: 16px">
        请妥善保管您的Secret Key，它只会在此时显示一次！
      </a-alert>
      <a-form layout="vertical">
        <a-form-item label="Access Key">
          <a-input :model-value="createdAK.access_key" readonly>
            <template #suffix>
              <a-button type="text" size="small" @click="copyToClipboard(createdAK.access_key)">
                <icon-copy />
              </a-button>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="Secret Key">
          <a-textarea :model-value="createdAK.secret_key" readonly :rows="3" style="font-family: monospace; font-size: 12px; letter-spacing: 1px;">
            <template #suffix>
              <a-button type="text" size="small" @click="copyToClipboard(createdAK.secret_key)">
                <icon-copy />
              </a-button>
            </template>
          </a-textarea>
        </a-form-item>
        <a-form-item label="名称">
          <a-input :model-value="createdAK.name" readonly />
        </a-form-item>
      </a-form>
      <div style="text-align: center; margin-top: 16px">
        <a-button type="primary" @click="secretKeyModalVisible = false">我已保存</a-button>
      </div>
    </a-modal>

    <!-- 编辑AK弹窗 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑Access Key"
      @ok="handleUpdate"
      @cancel="resetEditForm"
      :ok-loading="editLoading"
      :width="600"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model="editForm.name" placeholder="请输入AK名称" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model="editForm.description" placeholder="请输入描述信息" :rows="3" />
        </a-form-item>
        <a-form-item label="权限配置">
          <a-table :data="editForm.permissions" :pagination="false" size="small">
            <template #columns>
              <a-table-column title="资源" width="120">
                <template #cell="{ rowIndex }">
                  <a-select v-model="editForm.permissions[rowIndex].resource" style="width: 100%">
                    <a-option value="detect">敏感词检测</a-option>
                    <a-option value="filter">文本过滤</a-option>
                    <a-option value="correction">文本纠错</a-option>
                    <a-option value="word">词汇管理</a-option>
                    <a-option value="*">所有资源</a-option>
                  </a-select>
                </template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell="{ rowIndex }">
                  <a-select v-model="editForm.permissions[rowIndex].actions" multiple style="width: 100%">
                    <a-option value="read">读取</a-option>
                    <a-option value="write">写入</a-option>
                    <a-option value="update">更新</a-option>
                    <a-option value="delete">删除</a-option>
                    <a-option value="*">所有操作</a-option>
                  </a-select>
                </template>
              </a-table-column>
              <a-table-column title="操作" width="60">
                <template #cell="{ rowIndex }">
                  <a-button type="text" size="small" status="danger" @click="removeEditPermission(rowIndex)">
                    <icon-minus />
                  </a-button>
                </template>
              </a-table-column>
            </template>
          </a-table>
          <a-button type="text" size="small" @click="addEditPermission" style="margin-top: 8px">
            <template #icon>
              <icon-plus />
            </template>
            添加权限
          </a-button>
        </a-form-item>
        <a-form-item label="IP白名单">
          <a-textarea
            v-model="editIpWhitelistText"
            placeholder="每行一个IP地址，支持CIDR格式&#10;留空表示允许所有IP访问"
            :rows="4"
          />
        </a-form-item>
        <a-form-item label="速率限制（每分钟）" required>
          <a-input-number v-model="editForm.rate_limit" :min="1" :max="10000" style="width: 100%" />
        </a-form-item>
        <a-form-item label="过期时间">
          <a-date-picker v-model="editForm.expires_at" show-time style="width: 100%" />
          <template #extra>不选择表示永不过期</template>
        </a-form-item>
        <a-form-item label="状态">
          <a-switch v-model="editForm.is_active" checked-text="启用" unchecked-text="禁用" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { accessKeysApi } from '@/api';

interface AccessKey {
  id: string;
  access_key: string;
  secret_key?: string;
  name: string;
  description?: string;
  is_active: boolean;
  permissions: Array<{ resource: string; actions: string[] }>;
  ip_whitelist: string[];
  rate_limit: number;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

const accessKeys = ref<AccessKey[]>([]);
const loading = ref(false);
const createModalVisible = ref(false);
const editModalVisible = ref(false);
const secretKeyModalVisible = ref(false);
const createLoading = ref(false);
const editLoading = ref(false);
const editingKeyId = ref('');

const createForm = reactive({
  name: '',
  description: '',
  permissions: [] as Array<{ resource: string; actions: string[] }>,
  ip_whitelist: [] as string[],
  rate_limit: 1000,
  expires_at: undefined as string | undefined,
});

const editForm = reactive({
  name: '',
  description: '',
  permissions: [] as Array<{ resource: string; actions: string[] }>,
  ip_whitelist: [] as string[],
  rate_limit: 1000,
  expires_at: undefined as string | undefined,
  is_active: true,
});

const ipWhitelistText = ref('');
const editIpWhitelistText = ref('');

const createdAK = reactive({
  access_key: '',
  secret_key: '',
  name: '',
});

const loadAccessKeys = async () => {
  loading.value = true;
  try {
    const result = await accessKeysApi.list();
    if (result.success) {
      if (Array.isArray(result.data)) {
        // 如果是数组（兼容旧格式）
        accessKeys.value = result.data;
      } else if (result.data && Array.isArray(result.data.access_keys)) {
        // 如果是对象格式（新格式）
        accessKeys.value = result.data.access_keys;
      }
    }
  } catch (error: any) {
    Message.error('加载Access Key列表失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

const showCreateModal = () => {
  createModalVisible.value = true;
  createForm.permissions = [{ resource: '*', actions: ['*'] }];
};

const addPermission = () => {
  createForm.permissions.push({ resource: '', actions: [] });
};

const removePermission = (index: number) => {
  createForm.permissions.splice(index, 1);
};

const addEditPermission = () => {
  editForm.permissions.push({ resource: '', actions: [] });
};

const removeEditPermission = (index: number) => {
  editForm.permissions.splice(index, 1);
};

const handleCreate = async () => {
  if (!createForm.name) {
    Message.warning('名称不能为空');
    return;
  }
  if (createForm.permissions.length === 0) {
    Message.warning('请至少配置一个权限');
    return;
  }

  // 处理IP白名单
  createForm.ip_whitelist = ipWhitelistText.value
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip);

  try {
    createLoading.value = true;
    const result = await accessKeysApi.create(createForm);
    if (result.success && result.data) {
      // 显示Secret Key
      Object.assign(createdAK, result.data);
      secretKeyModalVisible.value = true;
      createModalVisible.value = false;
      resetCreateForm();
      loadAccessKeys();
    } else {
      Message.error('创建失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('创建失败: ' + (error.message || '未知错误'));
  } finally {
    createLoading.value = false;
  }
};

const resetCreateForm = () => {
  createForm.name = '';
  createForm.description = '';
  createForm.permissions = [];
  createForm.ip_whitelist = [];
  createForm.rate_limit = 1000;
  createForm.expires_at = undefined;
  ipWhitelistText.value = '';
};

const handleEdit = (accessKey: AccessKey) => {
  editingKeyId.value = accessKey.id;
  editForm.name = accessKey.name;
  editForm.description = accessKey.description || '';
  editForm.permissions = JSON.parse(JSON.stringify(accessKey.permissions || []));
  editForm.ip_whitelist = [...(accessKey.ip_whitelist || [])];
  editIpWhitelistText.value = editForm.ip_whitelist.join('\n');
  editForm.rate_limit = accessKey.rate_limit || 1000;
  editForm.expires_at = accessKey.expires_at || undefined;
  editForm.is_active = accessKey.is_active;
  editModalVisible.value = true;
};

const handleUpdate = async () => {
  if (!editForm.name) {
    Message.warning('名称不能为空');
    return;
  }
  if (editForm.permissions.length === 0) {
    Message.warning('请至少配置一个权限');
    return;
  }

  // 处理IP白名单
  editForm.ip_whitelist = editIpWhitelistText.value
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip);

  try {
    editLoading.value = true;
    const updateData = {
      name: editForm.name,
      description: editForm.description,
      permissions: editForm.permissions,
      ip_whitelist: editForm.ip_whitelist,
      rate_limit: editForm.rate_limit,
      expires_at: editForm.expires_at,
      is_active: editForm.is_active,
    };

    const result = await accessKeysApi.update(editingKeyId.value, updateData);
    if (result.success) {
      Message.success('Access Key更新成功');
      editModalVisible.value = false;
      resetEditForm();
      loadAccessKeys();
    } else {
      Message.error('更新失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('更新失败: ' + (error.message || '未知错误'));
  } finally {
    editLoading.value = false;
  }
};

const resetEditForm = () => {
  editForm.name = '';
  editForm.description = '';
  editForm.permissions = [];
  editForm.ip_whitelist = [];
  editForm.rate_limit = 1000;
  editForm.expires_at = undefined;
  editForm.is_active = true;
  editIpWhitelistText.value = '';
  editingKeyId.value = '';
};

const handleDisable = async (id: string) => {
  try {
    const result = await accessKeysApi.disable(id);
    if (result.success) {
      Message.success('Access Key已禁用');
      loadAccessKeys();
    } else {
      Message.error('禁用失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('禁用失败: ' + (error.message || '未知错误'));
  }
};

const handleEnable = async (id: string) => {
  try {
    const result = await accessKeysApi.enable(id);
    if (result.success) {
      Message.success('Access Key已启用');
      loadAccessKeys();
    } else {
      Message.error('启用失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('启用失败: ' + (error.message || '未知错误'));
  }
};

const handleDelete = async (id: string) => {
  try {
    const result = await accessKeysApi.delete(id);
    if (result.success) {
      Message.success('Access Key删除成功');
      loadAccessKeys();
    } else {
      Message.error('删除失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('删除失败: ' + (error.message || '未知错误'));
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    Message.success('已复制到剪贴板');
  } catch (error) {
    Message.error('复制失败');
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  loadAccessKeys();
});
</script>

<style scoped lang="less">
.access-keys-view {
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

  :deep(.arco-table) {
    border-radius: 6px;
  }

  :deep(.arco-table-th) {
    background: #f7f8fa;
    font-weight: 500;
  }

  :deep(.arco-table-tr:hover) {
    background: rgba(22, 93, 255, 0.03);
  }

  :deep(.arco-btn-primary) {
    background: #165dff;
    border-color: #165dff;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  :deep(.arco-btn-primary:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(22, 93, 255, 0.3);
  }

  :deep(.arco-tag) {
    border-radius: 4px;
    padding: 2px 8px;
  }

  :deep(.arco-input-password input) {
    font-family: monospace;
    letter-spacing: 2px;
  }

  :deep(.arco-modal-body) {
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>
