<template>
  <div
    id="app"
    style="
      padding: 20px;
      background: #f5f7fa;
      height: 100vh;
      overflow: hidden;
      box-sizing: border-box;
    "
  >
    <div class="layout">
      <!-- 左侧：主题管理 -->
      <div class="left">
        <div class="title">主题管理</div>
        <el-button
          type="primary"
          icon="el-icon-plus"
          @click="addTheme"
          style="width: 100%; margin-bottom: 10px"
        >
          主题
        </el-button>

        <!-- 列表区域：单独滚动 -->
        <div class="menu-container">
          <el-menu :default-active="activeThemeId" class="menu">
            <el-menu-item
              v-for="item in themeList"
              :key="item.id"
              :index="item.id + ''"
              @click="switchTheme(item.id)"
            >
              <span
                style="flex: 1"
                class="text-ellipsis-single"
                :title="item.name"
              >
                {{ item.name }}
              </span>
              <div style="display: flex; gap: 5px">
                <el-button
                  size="mini"
                  icon="el-icon-edit"
                  type="text"
                  @click.stop="editTheme(item)"
                ></el-button>
                <el-button
                  size="mini"
                  icon="el-icon-delete"
                  type="text"
                  style="color: #f56c6c"
                  @click.stop="deleteTheme(item.id)"
                ></el-button>
              </div>
            </el-menu-item>
          </el-menu>
        </div>
      </div>

      <!-- 右侧：排名列表 -->
      <div class="right">
        <div class="title">
          <span>{{ currentThemeName }}</span>
          <div
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              flex-wrap: wrap;
            "
          >
            <el-button
              type="success"
              icon="el-icon-upload"
              @click="handleSaveToCloud"
              :class="{ flash: saveBtnFlash }"
              :loading="loading"
            >
              保存到云端
            </el-button>
            <el-button
              type="primary"
              icon="el-icon-plus"
              @click="addRankItem"
            >
              排名
            </el-button>
            <el-dropdown
              split-button
              type="primary"
              @click="sortRankListByRankNumber"
            >
              排名整理
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="sortRankListByPosition">
                  以位置为准
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <el-switch
              v-model="isSpeedMode"
              active-color="#13ce66"
              inactive-color="#ff4949"
              active-text="极速模式"
            >
            </el-switch>
          </div>
        </div>

        <el-table
          v-loading="loading"
          :data="currentRankList"
          border
          style="width: 100%"
          height="calc(100% - 45px)"
          row-key="id"
          stripe
        >
          <el-table-column label="" prop="" width="40" align="center">
            <template slot-scope="scope">
              <i
                class="el-icon-rank"
                style="cursor: move"
                @mousedown="(e) => startDrag(e, scope.$index)"
              ></i>
            </template>
          </el-table-column>
          <el-table-column label="排名" prop="rank" width="160" align="center">
            <template slot-scope="scope">
              <div v-if="isSpeedMode" style="width: 100%">
                <el-input-number
                  v-model="scope.row.rank"
                  size="mini"
                  controls-position="right"
                  style="width: 100%"
                ></el-input-number>
              </div>
              <div v-else>{{ scope.row.rank }}</div>
            </template>
          </el-table-column>
          <el-table-column label="名称" prop="name" width="200">
            <template slot-scope="scope">
              <div v-if="isSpeedMode">
                <el-input
                  v-model="scope.row.name"
                  size="mini"
                  style="width: 100%"
                ></el-input>
              </div>
              <div v-else>{{ scope.row.name }}</div>
            </template>
          </el-table-column>
          <el-table-column label="描述" prop="desc">
            <template slot-scope="scope">
              <div v-if="isSpeedMode">
                <el-input
                  v-model="scope.row.desc"
                  type="textarea"
                  size="mini"
                  :rows="1"
                  style="width: 100%"
                ></el-input>
              </div>
              <div v-else v-html="getDescText(scope.row.desc)"></div>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            :width="isSpeedMode ? '90' : '180'"
            align="center"
          >
            <template slot-scope="scope">
              <el-button
                v-if="!isSpeedMode"
                size="mini"
                type="primary"
                @click="editItem(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                size="mini"
                type="danger"
                @click="deleteItem(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      :visible.sync="themeDialog"
      title="主题信息"
      :close-on-click-modal="false"
    >
      <el-input v-model="themeForm.name" placeholder="请输入主题名称" />
      <div slot="footer" class="dialog-footer">
        <el-button @click="themeDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTheme">确认保存</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :visible.sync="itemDialog"
      title="编辑排名"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="排名">
          <el-input-number v-model="itemForm.rank"></el-input-number>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="itemForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="itemForm.desc" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="itemDialog = false">取消</el-button>
        <el-button type="primary" @click="saveItem">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { JSONBIN_MASTER_KEY, JSONBIN_BIN_ID, ADMIN_PASSWORD } from "@/const.js";

export default {
  name: "App",
  data() {
    return {
      loading: false,
      JSONBIN_MASTER_KEY: JSONBIN_MASTER_KEY,
      JSONBIN_BIN_ID: JSONBIN_BIN_ID,
      ADMIN_PASSWORD: ADMIN_PASSWORD,

      themeList: [],
      activeThemeId: "1",
      currentThemeId: 1,
      editThemeId: null,

      rankList: {},
      themeDialog: false,
      itemDialog: false,
      themeForm: { name: "" },
      itemForm: { rank: "", name: "", desc: "" },
      editItemId: null,

      saveBtnFlash: false,
      saveBtnCooling: false,
      flashCooldownSeconds: 20,
      isSpeedMode: false,

      dragIndex: null,
      hasEnteredAdminPassword: false,
    };
  },
  computed: {
    currentThemeName() {
      const theme = this.themeList.find((t) => t.id === this.currentThemeId);
      return theme ? theme.name : "请选择主题";
    },
    currentRankList() {
      return this.rankList[this.currentThemeId] || [];
    },
  },
  mounted() {
    this.loadAllData();
  },
  methods: {
    getDescText(content) {
      if (!content) return "";
      return this.$lr.lr(content.replace(/<\/?[^>]+>/gi, " "));
    },

    startDrag(e, index) {
      e.preventDefault();
      this.dragIndex = index;
      document.addEventListener("mousemove", this.onDragMove);
      document.addEventListener("mouseup", this.onDragEnd);
    },
    onDragMove(e) {
      if (this.dragIndex == null) return;
      e.preventDefault();

      const list = this.currentRankList;
      if (!list || list.length <= 1) return;

      const rows = document.querySelectorAll(".el-table__body-wrapper tr");
      let targetIndex = this.dragIndex;

      for (let i = 0; i < rows.length; i++) {
        const rect = rows[i].getBoundingClientRect();
        if (e.clientY > rect.top && e.clientY < rect.bottom) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex !== this.dragIndex) {
        const data = [...list];
        const moveItem = data.splice(this.dragIndex, 1)[0];
        data.splice(targetIndex, 0, moveItem);
        this.rankList[this.currentThemeId] = data;
        this.dragIndex = targetIndex;
      }
    },
    onDragEnd() {
      if (this.dragIndex != null) {
        this.triggerSaveFlash();
      }
      this.dragIndex = null;
      document.removeEventListener("mousemove", this.onDragMove);
      document.removeEventListener("mouseup", this.onDragEnd);
    },

    sortRankListByRankNumber() {
      const list = this.currentRankList;
      if (!list || list.length === 0) return;
      const sorted = [...list].sort((a, b) => {
        let rankA = a.rank ?? "";
        let rankB = b.rank ?? "";
        if (rankA === "") return -1;
        if (rankB === "") return 1;
        return Number(rankA) - Number(rankB);
      });
      this.rankList[this.currentThemeId] = sorted;
      this.triggerSaveFlash();
    },
    sortRankListByPosition() {
      const list = this.currentRankList;
      if (!list || list.length === 0) return;
      const updated = list.map((item, index) => ({ ...item, rank: index + 1 }));
      this.rankList[this.currentThemeId] = updated;
      this.triggerSaveFlash();
    },

    triggerSaveFlash() {
      if (this.saveBtnCooling) return;
      this.saveBtnFlash = true;
      this.saveBtnCooling = true;
      setTimeout(() => (this.saveBtnFlash = false), 1500);
      setTimeout(
        () => (this.saveBtnCooling = false),
        this.flashCooldownSeconds * 1000
      );
    },

    async loadAllData() {
      try {
        this.loading = true;
        const res = await fetch(
          `https://api.jsonbin.io/v3/b/${this.JSONBIN_BIN_ID}/latest`,
          { headers: { "X-Master-Key": this.JSONBIN_MASTER_KEY } }
        );
        const data = await res.json();
        this.themeList = data.record.themeList || [];
        this.rankList = data.record.rankList || {};
        if (this.themeList.length) {
          this.currentThemeId = this.themeList[0].id;
          this.activeThemeId = this.currentThemeId + "";
        }
      } catch (e) {
        this.$message.error("加载失败");
      } finally {
        this.loading = false;
      }
    },

    async handleSaveToCloud() {
      if (this.hasEnteredAdminPassword) {
        await this.saveToCloud();
        return;
      }

      this.$prompt("请输入管理员密码", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputRequired: true,
        inputType: "password",
        inputPattern: /\S/,
        inputErrorMessage: "密码不能为空",
      })
        .then(async ({ value }) => {
          if (value !== this.ADMIN_PASSWORD) {
            this.$message.error("密码错误");
          } else {
            this.hasEnteredAdminPassword = true;
            await this.saveToCloud();
          }
        })
        .catch(() => {});
    },

    async saveToCloud() {
      try {
        this.loading = true;
        const res = await fetch(
          `https://api.jsonbin.io/v3/b/${this.JSONBIN_BIN_ID}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Master-Key": this.JSONBIN_MASTER_KEY,
            },
            body: JSON.stringify({
              themeList: this.themeList,
              rankList: this.rankList,
            }),
          }
        );
        if (!res.ok) throw new Error("保存失败");
        this.$message.success("保存成功");
      } catch (e) {
        this.$message.error("保存失败");
      } finally {
        this.loading = false;
      }
    },

    switchTheme(id) {
      this.currentThemeId = Number(id);
      this.activeThemeId = id + "";
    },

    addTheme() {
      this.editThemeId = null;
      this.themeForm.name = "";
      this.themeDialog = true;
    },
    editTheme(item) {
      this.editThemeId = item.id;
      this.themeForm.name = item.name;
      this.themeDialog = true;
    },
    saveTheme() {
      const name = (this.themeForm.name || "").trim();
      if (!name) return this.$message.warning("请输入主题名");

      if (this.editThemeId) {
        const idx = this.themeList.findIndex((t) => t.id === this.editThemeId);
        if (idx > -1) this.themeList[idx].name = name;
      } else {
        const max = this.themeList.length
          ? Math.max(...this.themeList.map((t) => t.id))
          : 0;
        const newId = max + 1;
        this.themeList.push({ id: newId, name });
        this.rankList[newId] = [];

        this.switchTheme(newId);
      }
      this.themeDialog = false;
      this.triggerSaveFlash();
    },
    deleteTheme(id) {
      this.$confirm("确定删除该主题吗？")
        .then(() => {
          this.themeList = this.themeList.filter((t) => t.id !== id);
          delete this.rankList[id];

          if (this.themeList.length > 0) {
            const firstId = this.themeList[0].id;
            this.currentThemeId = firstId;
            this.activeThemeId = firstId + "";
          } else {
            this.currentThemeId = 0;
            this.activeThemeId = "";
          }
          this.triggerSaveFlash();
        })
        .catch(() => {});
    },

    addRankItem() {
      if (!this.currentThemeId) {
        this.$message.warning("请先选择或创建一个主题");
        return;
      }

      const list = this.rankList[this.currentThemeId] || [];
      if (this.isSpeedMode) {
        const newId =
          (list.length ? Math.max(...list.map((i) => i.id || 0)) : 0) + 1;
        list.push({ id: newId, rank: "", name: "", desc: "" });
        this.rankList[this.currentThemeId] = list;
        return;
      }
      this.editItemId = null;
      this.itemForm = { rank: "", name: "", desc: "" };
      this.itemDialog = true;
    },
    editItem(row) {
      this.editItemId = row.id;
      this.itemForm = { ...row };
      this.itemDialog = true;
    },
    saveItem() {
      const list = this.rankList[this.currentThemeId];
      if (!list) return;

      if (this.editItemId) {
        const idx = list.findIndex((i) => i.id === this.editItemId);
        if (idx > -1) list[idx] = { ...this.itemForm };
      } else {
        const newId =
          (list.length ? Math.max(...list.map((i) => i.id)) : 0) + 1;
        list.push({ ...this.itemForm, id: newId });
      }
      this.itemDialog = false;
      this.triggerSaveFlash();
    },
    deleteItem(id) {
      this.$confirm("确定删除？")
        .then(() => {
          this.deleteItemById(id);
        })
        .catch(() => {});
    },
    deleteItemById(id) {
      const list = this.rankList[this.currentThemeId];
      if (!list) return;
      this.rankList[this.currentThemeId] = list.filter((i) => i.id !== id);
      this.triggerSaveFlash();
    },
  },
};
</script>

<!-- 全局样式：清除浏览器默认 margin:8px -->
<style>
html,
body {
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  height: 100% !important;
}
</style>

<style scoped>
/* 基础布局 占满全屏无溢出 */
.layout {
  display: flex;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  gap: 20px;
  box-sizing: border-box;
  overflow: hidden;
}

.left {
  width: 260px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px #00000010;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 主题列表：独立滚动区域 */
.menu-container {
  flex: 1;
  overflow-y: auto;
  margin-top: 4px;
}

.right {
  flex: 1;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px #00000010;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.menu li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ====================== 移动端 / iPad 适配 ====================== */
@media (max-width: 1024px) {
  .layout {
    flex-direction: column;
  }
  .left {
    width: 100%;
    max-height: 30vh;
  }
  .right {
    flex: 1;
  }
}

@media (max-width: 768px) {
  #app {
    padding: 12px;
  }
  .left,
  .right {
    padding: 16px;
    border-radius: 10px;
  }
  .title {
    font-size: 16px;
  }
}

/* 禁止选中 */
::v-deep .el-table__body-wrapper * {
  user-select: none !important;
  -webkit-user-select: none !important;
}

.el-icon-rank {
  cursor: move !important;
}

/* 按钮闪烁 */
.flash {
  animation: flashAnim 0.5s ease-in-out 3;
}
@keyframes flashAnim {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.06);
  }
}
</style>