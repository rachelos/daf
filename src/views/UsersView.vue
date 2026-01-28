<template>
  <div class="users-view">
    <a-card title="用户管理" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="showCreateModal">
          <template #icon>
            <icon-user-add />
          </template>
          创建用户
        </a-button>
      </template>

      <!-- PC端表格显示 -->
      <div class="desktop-view">
        <a-table :data="users" :loading="loading" :pagination="false">
          <template #columns>
            <a-table-column title="用户名" data-index="username" />
            <a-table-column title="角色" data-index="roles">
              <template #cell="{ record }">
                <a-tag v-for="role in record.roles" :key="role" color="green">
                  {{ role }}
                </a-tag>
              </template>
            </a-table-column>
            <a-table-column title="状态" data-index="is_active">
              <template #cell="{ record }">
                <a-tag :color="record.is_active ? 'green' : 'red'">
                  {{ record.is_active ? '激活' : '禁用' }}
                </a-tag>
              </template>
            </a-table-column>
            <a-table-column title="操作">
              <template #cell="{ record }">
                <a-space>
                  <a-button type="text" size="small" @click="handleEdit(record)">
                    <template #icon>
                      <icon-edit />
                    </template>
                    编辑
                  </a-button>
                  <a-button
                    v-if="record.username !== 'admin'"
                    type="text"
                    size="small"
                    status="danger"
                    @click="handleDelete(record.id)"
                  >
                    <template #icon>
                      <icon-delete />
                    </template>
                    删除
                  </a-button>
                </a-space>
              </template>
            </a-table-column>
          </template>
        </a-table>
        <a-pagination
          v-if="total > 0"
          v-model:current="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :show-total="true"
          :show-jumper="true"
          :show-page-size="true"
          @change="handlePageChange"
          @page-size-change="handlePageSizeChange"
          class="pagination"
        />
      </div>

      <!-- 移动端卡片显示 -->
      <div class="mobile-view">
        <a-empty v-if="!loading && users.length === 0" description="暂无用户数据" />
        <a-spin :loading="loading" style="width: 100%">
          <div class="user-cards">
            <div v-for="record in users" :key="record.id" class="user-card">
              <a-descriptions :column="1" bordered>
                <a-descriptions-item label="用户名">
                  {{ record.username }}
                </a-descriptions-item>
                <a-descriptions-item label="角色">
                  <a-space wrap>
                    <a-tag v-for="role in record.roles" :key="role" color="green">
                      {{ role }}
                    </a-tag>
                  </a-space>
                </a-descriptions-item>
                <a-descriptions-item label="状态">
                  <a-tag :color="record.is_active ? 'green' : 'red'">
                    {{ record.is_active ? '激活' : '禁用' }}
                  </a-tag>
                </a-descriptions-item>
              </a-descriptions>
              <div class="user-actions">
                <a-button type="primary" size="small" @click="handleEdit(record)">
                  <template #icon>
                    <icon-edit />
                  </template>
                  编辑
                </a-button>
                <a-button
                  v-if="record.username !== 'admin'"
                  type="primary"
                  status="danger"
                  size="small"
                  @click="handleDelete(record.id)"
                >
                  <template #icon>
                    <icon-delete />
                  </template>
                  删除
                </a-button>
              </div>
            </div>
          </div>
          <a-pagination
            v-if="total > 0"
            v-model:current="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :show-total="true"
            :show-jumper="false"
            :show-page-size="false"
            @change="handlePageChange"
            @page-size-change="handlePageSizeChange"
            class="pagination"
          />
        </a-spin>
      </div>
    </a-card>

    <!-- 创建用户弹窗 -->
    <a-modal v-model:visible="createModalVisible" title="创建用户" @ok="handleCreate" @cancel="resetCreateForm">
      <a-form :model="createForm" layout="vertical">
        <a-form-item label="用户名" required>
          <a-input v-model="createForm.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="密码" required>
          <a-input-password v-model="createForm.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item label="角色" required>
          <a-select v-model="createForm.roles" multiple placeholder="请选择角色">
            <a-option value="user">普通用户</a-option>
            <a-option value="admin">管理员</a-option>
            <a-option value="word_manager">词库管理员</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-switch v-model="createForm.is_active" checked-text="激活" unchecked-text="禁用" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑用户弹窗 -->
    <a-modal v-model:visible="editModalVisible" title="编辑用户" @ok="handleUpdate" @cancel="resetEditForm">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="用户名">
          <a-input v-model="editForm.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="密码">
          <a-input-password v-model="editForm.password" placeholder="留空则不修改密码" />
        </a-form-item>
        <a-form-item label="角色" required>
          <a-select v-model="editForm.roles" multiple placeholder="请选择角色">
            <a-option value="user">普通用户</a-option>
            <a-option value="admin">管理员</a-option>
            <a-option value="word_manager">词库管理员</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-switch v-model="editForm.is_active" checked-text="激活" unchecked-text="禁用" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import { usersApi } from '@/api';

interface User {
  id: string;
  username: string;
  roles: string[];
  is_active: boolean;
}

const users = ref<User[]>([]);
const loading = ref(false);
const createModalVisible = ref(false);
const editModalVisible = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const createForm = reactive({
  username: '',
  password: '',
  roles: ['user'] as string[],
  is_active: true,
});

const editForm = reactive({
  username: '',
  password: '',
  roles: [] as string[],
  is_active: true,
});
const editingUserId = ref('');

const loadUsers = async () => {
  loading.value = true;
  try {
    const result = await usersApi.list({ page: currentPage.value, page_size: pageSize.value });
    if (result.success && result.data) {
      users.value = result.data.users || [];
      total.value = result.data.total || 0;
    }
  } catch (error: any) {
    Message.error('加载用户列表失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

const showCreateModal = () => {
  createModalVisible.value = true;
};

const handleCreate = async () => {
  if (!createForm.username || !createForm.password) {
    Message.warning('用户名和密码不能为空');
    return;
  }
  if (createForm.roles.length === 0) {
    Message.warning('请至少选择一个角色');
    return;
  }

  try {
    const result = await usersApi.create(createForm);
    if (result.success) {
      Message.success('用户创建成功');
      createModalVisible.value = false;
      resetCreateForm();
      currentPage.value = 1;
      loadUsers();
    } else {
      Message.error('创建失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('创建失败: ' + (error.message || '未知错误'));
  }
};

const resetCreateForm = () => {
  createForm.username = '';
  createForm.password = '';
  createForm.roles = ['user'];
  createForm.is_active = true;
};

const handleEdit = (user: User) => {
  editingUserId.value = user.id;
  editForm.username = user.username;
  editForm.password = '';
  editForm.roles = [...user.roles];
  editForm.is_active = user.is_active;
  editModalVisible.value = true;
};

const handleUpdate = async () => {
  if (editForm.roles.length === 0) {
    Message.warning('请至少选择一个角色');
    return;
  }

  try {
    const updateData: any = {
      username: editForm.username,
      roles: editForm.roles,
      is_active: editForm.is_active,
    };

    if (editForm.password) {
      updateData.password = editForm.password;
    }

    const result = await usersApi.update(editingUserId.value, updateData);
    if (result.success) {
      Message.success('用户更新成功');
      editModalVisible.value = false;
      resetEditForm();
      loadUsers();
    } else {
      Message.error('更新失败: ' + (result.message || '未知错误'));
    }
  } catch (error: any) {
    Message.error('更新失败: ' + (error.message || '未知错误'));
  }
};

const resetEditForm = () => {
  editForm.username = '';
  editForm.password = '';
  editForm.roles = [];
  editForm.is_active = true;
  editingUserId.value = '';
};

const handleDelete = (userId: string) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个用户吗？此操作不可撤销。',
    onOk: async () => {
      try {
        const result = await usersApi.delete(userId);
        if (result.success) {
          Message.success('用户删除成功');
          // 如果当前页只有一条数据且不是第一页，则回到上一页
          if (users.value.length === 1 && currentPage.value > 1) {
            currentPage.value -= 1;
          }
          loadUsers();
        } else {
          Message.error('删除失败: ' + (result.message || '未知错误'));
        }
      } catch (error: any) {
        Message.error('删除失败: ' + (error.message || '未知错误'));
      }
    },
  });
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadUsers();
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadUsers();
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="less">
.users-view {
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

  // 桌面端视图
  .desktop-view {
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
      background: #165DFF;
      border-color: #165DFF;
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

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;

      :deep(.arco-pagination) {
        font-size: 14px;
      }
    }
  }

  // 移动端视图
  .mobile-view {
    display: none;

    .user-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .user-card {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      :deep(.arco-descriptions) {
        margin-bottom: 0;

        .arco-descriptions-table {
          width: 100%;
        }

        .arco-descriptions-item-label {
          width: 80px;
          background: #f7f8fa;
          font-weight: 500;
        }

        .arco-descriptions-item-value {
          color: #333;
        }
      }

      .user-actions {
        padding: 12px 16px;
        border-top: 1px solid #f0f0f0;
        display: flex;
        gap: 8px;
        justify-content: flex-end;

        :deep(.arco-btn) {
          border-radius: 6px;
        }
      }
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: center;
      overflow-x: auto;

      :deep(.arco-pagination) {
        font-size: 13px;
        min-width: 200px;

        .arco-pagination-item,
        .arco-pagination-total {
          font-size: 13px;
        }
      }
    }
  }

  // 响应式媒体查询
  @media (max-width: 768px) {
    .desktop-view {
      display: none;
    }

    .mobile-view {
      display: block;
    }

    :deep(.arco-card-body) {
      padding: 12px;
    }
  }
}
</style>
