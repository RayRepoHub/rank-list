<template>
  <div
    id="app"
    style="
      padding: 20px;
      background: #f5f7fa;
      height: calc(100vh - 16px);
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

      <!-- 右侧：排名列表 -->
      <div class="right">
        <div class="title">
          <span>{{ currentThemeName }}</span>
          <div style="display: flex; align-items: center; gap: 8px">
            <!-- 保存到云端按钮 + 闪烁绑定 -->
            <el-button
              type="success"
              icon="el-icon-upload"
              @click="handleSaveToCloud"
              :class="{ flash: saveBtnFlash }"
              :loading="loading"
            >
              保存到云端
            </el-button>
            <el-button type="primary" icon="el-icon-plus" @click="addRankItem">
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
            <!-- 极速模式 -->
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
          height="calc(100% - 40px)"
          row-key="id"
        >
          <el-table-column label="" prop="" width="40" align="center">
            <template slot-scope="scope">
              <i
                class="el-icon-rank"
                style="cursor: move"
                @mousedown="startDrag($event, scope.$index)"
              ></i>
            </template>
          </el-table-column>
          <el-table-column label="排名" prop="rank" width="160" align="center">
            <template slot-scope="scope">
              <el-input-number
                v-if="isSpeedMode"
                v-model="scope.row.rank"
                size="mini"
                controls-position="right"
              ></el-input-number>
              <div v-else>
                {{ scope.row.rank }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="名称" prop="name" width="200">
            <template slot-scope="scope">
              <el-input
                v-if="isSpeedMode"
                v-model="scope.row.name"
                size="mini"
              ></el-input>
              <div v-else>
                {{ scope.row.name }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="描述" prop="desc">
            <template slot-scope="scope">
              <el-input
                v-if="isSpeedMode"
                v-model="scope.row.desc"
                type="textarea"
                size="mini"
              ></el-input>
              <div v-else>
                {{ scope.row.desc }}
              </div>
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

    <!-- 主题 新增/编辑 弹窗 -->
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

    <!-- 排名编辑弹窗 -->
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
import { JSONBIN_MASTER_KEY, JSONBIN_BIN_ID } from "@/const.js";

export default {
  name: "App",
  data() {
    return {
      loading: false,
      JSONBIN_MASTER_KEY: JSONBIN_MASTER_KEY,
      JSONBIN_BIN_ID: JSONBIN_BIN_ID,

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

      // 按钮闪烁 + 冷却
      saveBtnFlash: false,
      saveBtnCooling: false,
      flashCooldownSeconds: 20,
      isSpeedMode: false,

      // 拖拽
      dragIndex: null,
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
    // ========== 拖拽（加了阻止选中） ==========
    startDrag(e, index) {
      // 关键：拖拽开始时阻止默认选中
      e.preventDefault();
      this.dragIndex = index;
      document.addEventListener("mousemove", this.onDragMove);
      document.addEventListener("mouseup", this.onDragEnd);
    },
    onDragMove(e) {
      if (this.dragIndex == null) return;
      // 关键：移动时继续阻止选中
      e.preventDefault();
      const rows = document.querySelectorAll(
        ".el-table__body-wrapper tbody tr"
      );
      for (let i = 0; i < rows.length; i++) {
        const rect = rows[i].getBoundingClientRect();
        if (e.clientY > rect.top && e.clientY < rect.bottom) {
          if (this.dragIndex !== i) {
            const data = [...this.currentRankList];
            const moveItem = data.splice(this.dragIndex, 1)[0];
            data.splice(i, 0, moveItem);
            this.rankList[this.currentThemeId] = data;
            this.dragIndex = i;
          }
          break;
        }
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

    // 根据排名数字从小到大排序，空值排在最前面
    sortRankListByRankNumber() {
      const list = this.currentRankList;
      if (!list || list.length === 0) return;

      const sorted = [...list].sort((a, b) => {
        let rankA = a.rank ?? "";
        let rankB = b.rank ?? "";

        if (rankA === "" && rankB !== "") return -1;
        if (rankA !== "" && rankB === "") return 1;

        return Number(rankA) - Number(rankB);
      });

      this.rankList[this.currentThemeId] = sorted;
      this.triggerSaveFlash();
    },

    // 根据当前列表的位置，重新设置 rank 从 1 开始递增
    sortRankListByPosition() {
      const list = this.currentRankList;
      if (!list || list.length === 0) return;

      const updated = list.map((item, index) => {
        return { ...item, rank: index + 1 };
      });

      this.rankList[this.currentThemeId] = updated;
      this.triggerSaveFlash();
    },
    // 触发保存按钮闪烁
    triggerSaveFlash() {
      if (this.saveBtnCooling) return;
      this.saveBtnFlash = true;
      this.saveBtnCooling = true;

      setTimeout(() => {
        this.saveBtnFlash = false;
      }, 1500);

      setTimeout(() => {
        this.saveBtnCooling = false;
      }, this.flashCooldownSeconds * 1000);
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
        if (this.themeList.length) this.currentThemeId = this.themeList[0].id;
        this.loading = false;
      } catch (e) {
        this.$message.error("加载失败");
      }
    },

    async handleSaveToCloud() {
      try {
        this.loading = true;
        await fetch(`https://api.jsonbin.io/v3/b/${this.JSONBIN_BIN_ID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Master-Key": this.JSONBIN_MASTER_KEY,
          },
          body: JSON.stringify({
            themeList: this.themeList,
            rankList: this.rankList,
          }),
        });
        this.loading = false;
      } catch (err) {
        this.$message.error("保存失败");
        this.loadAllData();
      }
    },

    switchTheme(id) {
      this.currentThemeId = Number(id);
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
      if (!this.themeForm.name) return this.$message.warning("请输入主题名");
      if (this.editThemeId) {
        const idx = this.themeList.findIndex((t) => t.id === this.editThemeId);
        this.themeList[idx].name = this.themeForm.name;
      } else {
        const newId = Math.max(...this.themeList.map((t) => t.id), 0) + 1;
        this.themeList.push({ id: newId, name: this.themeForm.name });
        this.rankList[newId] = [];
      }
      this.themeDialog = false;
      this.triggerSaveFlash();
    },
    deleteTheme(id) {
      this.$confirm("确定删除该主题吗？")
        .then(() => {
          this.themeList = this.themeList.filter((t) => t.id !== id);
          delete this.rankList[id];
          if (this.currentThemeId === id) {
            this.currentThemeId = this.themeList[0]?.id || 0;
          }
          this.triggerSaveFlash();
        })
        .catch(() => {});
    },
    addRankItem() {
      if (this.isSpeedMode) {
        const list = this.rankList[this.currentThemeId] || [];
        const newId = Math.max(...list.map((i) => i.id || 0), 0) + 1;
        list.push({ id: newId, rank: "", name: "", desc: "" });
        this.rankList[this.currentThemeId] = [...list];
        return;
      }
      this.editItemId = null;
      this.itemForm = { rank: "", name: "", desc: "" };
      this.itemDialog = true;
    },
    editItem(row) {
      this.editItemId = row.id;
      this.itemForm = JSON.parse(JSON.stringify(row));
      this.itemDialog = true;
    },
    saveItem() {
      const list = this.rankList[this.currentThemeId];
      if (this.editItemId) {
        let idx = list.findIndex((i) => i.id === this.editItemId);
        if (idx > -1) {
          list[idx].rank = this.itemForm.rank;
          list[idx].name = this.itemForm.name;
          list[idx].desc = this.itemForm.desc;
          this.rankList[this.currentThemeId] = [...list];
        }
      } else {
        const newId = Math.max(...list.map((i) => i.id || 0), 0) + 1;
        list.push({
          id: newId,
          rank: this.itemForm.rank,
          name: this.itemForm.name,
          desc: this.itemForm.desc,
        });
      }
      this.itemDialog = false;
      this.triggerSaveFlash();
    },
    deleteItem(id) {
      if (this.isSpeedMode) {
        this.deleteItemById(id);
      } else {
        this.$confirm("确定删除？")
          .then(() => {
            this.deleteItemById(id);
          })
          .catch(() => {});
      }
    },
    deleteItemById(id) {
      const list = this.rankList[this.currentThemeId];
      this.rankList[this.currentThemeId] = list.filter((i) => i.id !== id);
      this.triggerSaveFlash();
    },
  },
};
</script>

<style scoped>
.layout {
  display: flex;
  max-width: 1200px;
  height: 100%;
  margin: 0 auto;
  gap: 20px;
}
.left {
  width: 240px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px #00000010;
}
.right {
  flex: 1;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px #00000010;
}
.title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.menu li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ========== 终极禁止选中：覆盖所有单元格+子元素 ========== */
.el-table__body-wrapper,
.el-table__body,
.el-table__body tr,
.el-table__body td,
.el-table__body td div {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

.el-icon-rank {
  cursor: move !important;
}
.el-table__body-wrapper tr:active {
  opacity: 0.7;
  background: #e8f4ff !important;
}

/* 按钮闪烁动画 */
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