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
        <div class="title">
          <div>主题管理</div>
          <el-dropdown trigger="click">
            <span class="cursor-pointer">
              <i class="el-icon-s-tools"></i>设置
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="openBackupDialog">
                备份数据
              </el-dropdown-item>
              <el-dropdown-item @click.native="openRestoreDialog">
                数据回退
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
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
          <span style="display: flex; align-items: center; gap: 8px">
            {{ currentThemeName }}
            <!-- 右侧顶部主题说明图标 保留 -->
            <el-button
              v-if="currentThemeInfo && currentThemeInfo.description"
              icon="el-icon-info"
              type="text"
              style="color: #67c23a"
              @click.stop="showThemeDescription(currentThemeInfo)"
            />
          </span>
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
          :row-class-name="tableRowClassName"
        >
          <el-table-column label="" prop="" width="40" align="center">
            <template slot-scope="scope">
              <i
                class="el-icon-rank"
                style="cursor: move"
                @mousedown="(e) => startDrag(e, scope.$index)"
                @touchstart.prevent="(e) => startDrag(e, scope.$index)"
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
                  autosize
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

    <!-- 主题 新增/编辑 弹窗 -->
    <el-dialog
      :visible.sync="themeDialog"
      title="主题信息"
      :close-on-click-modal="false"
      width="500px"
    >
      <el-form label-width="80px">
        <el-form-item label="主题名称">
          <el-input v-model="themeForm.name" placeholder="请输入主题名称" />
        </el-form-item>
        <el-form-item label="主题说明">
          <el-input
            v-model="themeForm.description"
            type="textarea"
            :autosize="{ minRows: 4 }"
            placeholder="请输入主题说明（可选）"
          />
        </el-form-item>
      </el-form>
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
          <el-input
            v-model="itemForm.desc"
            type="textarea"
            :autosize="{ minRows: 4 }"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="itemDialog = false">取消</el-button>
        <el-button type="primary" @click="saveItem">保存</el-button>
      </div>
    </el-dialog>

    <!-- 查看主题说明弹窗 -->
    <el-dialog
      :visible.sync="showThemeDescDialog"
      title="主题说明"
      width="500px"
      :close-on-click-modal="false"
    >
      <div style="white-space: pre-wrap; line-height: 1.8">
        {{ currentViewThemeDesc }}
      </div>
    </el-dialog>

    <!-- ================== 备份弹窗 ================== -->
    <el-dialog
      :visible.sync="backupDialog"
      title="创建数据备份"
      width="500px"
      :close-on-click-modal="false"
      @close="resetBackupForm"
    >
      <el-form label-width="80px">
        <el-form-item label="备份说明">
          <el-input
            v-model="backupForm.note"
            type="textarea"
            :autosize="{ minRows: 3 }"
            placeholder="例如：版本1 / 稳定版 / 修改前备份"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="backupDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="backupLoading"
          @click="createBackup"
        >
          确认备份
        </el-button>
      </div>
    </el-dialog>

    <!-- ================== 回退弹窗 ================== -->
    <el-dialog
      :visible.sync="restoreDialog"
      title="选择备份并回退"
      width="720px"
      top="10vh"
      :close-on-click-modal="false"
    >
      <div v-if="backupListLoading" style="text-align: center">加载中...</div>
      <div v-else style="max-height: 450px; overflow-y: auto">
        <el-card
          v-for="(item, idx) in backupList"
          :key="idx"
          shadow="hover"
          style="margin-bottom: 10px"
        >
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 12px;
            "
          >
            <div style="flex: 1">
              <div><b>备份时间：</b></div>
              <div>
                {{ item.time }}
              </div>
              <div style="margin-top: 4px">
                <b>备份说明：</b>
              </div>
              <div>
                {{ item.note }}
              </div>
            </div>

            <div style="display: flex; gap: 6px; white-space: nowrap">
              <!-- 编辑备注 -->
              <el-button
                size="mini"
                type="primary"
                plain
                icon="el-icon-edit"
                @click="openEditBackupNote(idx, item.note)"
              >
                编辑备注
              </el-button>

              <!-- 更新备份（用当前数据覆盖） -->
              <el-button
                size="mini"
                type="success"
                plain
                icon="el-icon-refresh"
                @click="updateBackupVersion(idx)"
              >
                更新版本
              </el-button>

              <!-- 回退 -->
              <el-button size="mini" type="danger" @click="doRestore(item)">
                回退到此
              </el-button>

              <!-- 删除 -->
              <el-button
                size="mini"
                type="danger"
                plain
                icon="el-icon-delete"
                @click="deleteBackupVersion(idx)"
              >
                删除
              </el-button>
            </div>
          </div>
        </el-card>

        <div
          v-if="backupList.length === 0"
          style="text-align: center; color: #999; padding: 20px"
        >
          暂无备份
        </div>
      </div>
    </el-dialog>

    <!-- ================== 编辑备份备注弹窗 ================== -->
    <el-dialog
      :visible.sync="editBackupNoteDialog"
      title="编辑备份备注"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="备份说明">
          <el-input
            v-model="editBackupNoteForm.note"
            type="textarea"
            :autosize="{ minRows: 3 }"
            placeholder="请输入备注"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="editBackupNoteDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEditBackupNote">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  JSONBIN_MASTER_KEY,
  JSONBIN_BIN_ID,
  ADMIN_PASSWORD,
  JSONBIN_BACKUP_BIN_ID,
} from "@/const.js";

export default {
  name: "App",
  data() {
    return {
      loading: false,
      JSONBIN_MASTER_KEY: JSONBIN_MASTER_KEY,
      JSONBIN_BIN_ID: JSONBIN_BIN_ID,
      ADMIN_PASSWORD: ADMIN_PASSWORD,
      JSONBIN_BACKUP_BIN_ID: JSONBIN_BACKUP_BIN_ID,

      themeList: [],
      activeThemeId: "1",
      currentThemeId: 1,
      editThemeId: null,

      // 主题表单增加说明字段
      themeForm: { name: "", description: "" },

      rankList: {},
      themeDialog: false,
      itemDialog: false,
      itemForm: { rank: "", name: "", desc: "" },
      editItemId: null,

      saveBtnFlash: false,
      saveBtnCooling: false,
      flashCooldownSeconds: 20,
      isSpeedMode: false,

      dragIndex: null,
      hasEnteredAdminPassword: false,

      // 主题说明弹窗
      showThemeDescDialog: false,
      currentViewThemeDesc: "",

      // 备份相关
      backupDialog: false,
      backupLoading: false,
      backupForm: { note: "" },

      restoreDialog: false,
      backupList: [],
      backupListLoading: false,

      // 编辑备份备注
      editBackupNoteDialog: false,
      editBackupNoteForm: { note: "" },
      editBackupIndex: -1,
    };
  },
  computed: {
    currentThemeName() {
      const theme = this.themeList.find((t) => t.id === this.currentThemeId);
      return theme ? theme.name : "请选择主题";
    },
    // 当前主题完整信息
    currentThemeInfo() {
      return this.themeList.find((t) => t.id === this.currentThemeId) || null;
    },
    currentRankList() {
      return this.rankList[this.currentThemeId] || [];
    },
  },
  mounted() {
    this.loadAllData();
  },
  methods: {
    // ================== 封装：管理员密码校验 ==================
    async checkAdminPassword() {
      // 已验证过，直接通过
      if (this.hasEnteredAdminPassword) return true;

      try {
        const { value } = await this.$prompt("请输入管理员密码", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          inputRequired: true,
          inputType: "password",
          closeOnClickModal: false,
          inputPattern: /\S/,
          inputErrorMessage: "密码不能为空",
        });

        const isOk = value === this.ADMIN_PASSWORD;
        if (isOk) {
          this.hasEnteredAdminPassword = true;
        } else {
          this.$message.error("密码错误");
          return false;
        }

        // 核心：200ms 平滑缓冲，解决弹窗闪烁跳转
        await new Promise((resolve) => setTimeout(resolve, 200));
        return true;
      } catch {
        // 取消输入直接终止
        return false;
      }
    },
    // 查看主题说明
    showThemeDescription(item) {
      this.currentViewThemeDesc = item.description || "暂无说明";
      this.showThemeDescDialog = true;
    },

    getDescText(content) {
      if (!content) return "";
      return this.$lr.lr(content.replace(/<\/?[^>]+>/gi, " "));
    },

    tableRowClassName({ rowIndex }) {
      if (this.dragIndex === rowIndex && this.dragIndex !== null) {
        return "dragging-row";
      }
      return "";
    },

    startDrag(e, index) {
      e.preventDefault();
      this.dragIndex = index;
      // 拖拽开始 禁止选中文字
      document.body.classList.add("dragging-active");

      document.addEventListener("mousemove", this.onDragMove);
      document.addEventListener("mouseup", this.onDragEnd);
      document.addEventListener("touchmove", this.onDragMove);
      document.addEventListener("touchend", this.onDragEnd);
    },
    onDragMove(e) {
      if (this.dragIndex == null) return;
      e.preventDefault();

      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const list = this.currentRankList;
      if (!list || list.length <= 1) return;

      const rows = document.querySelectorAll(".el-table__body-wrapper tr");
      let targetIndex = this.dragIndex;

      for (let i = 0; i < rows.length; i++) {
        const rect = rows[i].getBoundingClientRect();
        if (clientY > rect.top && clientY < rect.bottom) {
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
      // 拖拽结束 恢复文字选中
      document.body.classList.remove("dragging-active");

      document.removeEventListener("mousemove", this.onDragMove);
      document.removeEventListener("mouseup", this.onDragEnd);
      document.removeEventListener("touchmove", this.onDragMove);
      document.removeEventListener("touchend", this.onDragEnd);
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
      const pass = await this.checkAdminPassword();
      if (!pass) return;
      await this.saveToCloud();
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
      this.themeForm = { name: "", description: "" };
      this.themeDialog = true;
    },
    editTheme(item) {
      this.editThemeId = item.id;
      this.themeForm = {
        name: item.name || "",
        description: item.description || "",
      };
      this.themeDialog = true;
    },
    saveTheme() {
      const name = (this.themeForm.name || "").trim();
      if (!name) return this.$message.warning("请输入主题名");

      const data = {
        name: name,
        description: (this.themeForm.description || "").trim(),
      };

      if (this.editThemeId) {
        const idx = this.themeList.findIndex((t) => t.id === this.editThemeId);
        if (idx > -1) {
          this.themeList[idx].name = data.name;
          this.themeList[idx].description = data.description;
        }
      } else {
        const max = this.themeList.length
          ? Math.max(...this.themeList.map((t) => t.id))
          : 0;
        const newId = max + 1;
        this.themeList.push({
          id: newId,
          name: data.name,
          description: data.description,
        });
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
        if (idx > -1) {
          list.splice(idx, 1, { ...this.itemForm });
        }
      } else {
        const newId =
          (list.length ? Math.max(...list.map((i) => i.id)) : 0) + 1;
        list.push({ ...this.itemForm, id: newId });
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
      if (!list) return;
      this.rankList[this.currentThemeId] = list.filter((i) => i.id !== id);
      this.triggerSaveFlash();
    },

    // ================== 备份功能 ==================
    resetBackupForm() {
      this.backupForm = { note: "" };
    },
    async openBackupDialog() {
      const pass = await this.checkAdminPassword();
      if (!pass) return;
      this.resetBackupForm();
      this.backupDialog = true;
    },
    async createBackup() {
      const note = this.backupForm.note?.trim() || "无说明";
      this.backupLoading = true;
      try {
        const now = new Date();
        const timeStr = now
          .toLocaleString("zh-CN", { hour12: false })
          .replaceAll("/", "-");

        const backupData = {
          time: timeStr,
          note: note,
          data: {
            themeList: JSON.parse(JSON.stringify(this.themeList)),
            rankList: JSON.parse(JSON.stringify(this.rankList)),
          },
        };

        const oldBackups = await this.loadAllBackupsPure();
        const newList = [backupData, ...oldBackups].slice(0, 50);

        await this.saveBackupListToCloud(newList);
        this.$message.success("备份成功");
        this.backupDialog = false;
      } catch (e) {
        this.$message.error("备份失败");
      } finally {
        this.backupLoading = false;
      }
    },

    async loadAllBackupsPure() {
      try {
        const res = await fetch(
          `https://api.jsonbin.io/v3/b/${this.JSONBIN_BACKUP_BIN_ID}/latest`,
          { headers: { "X-Master-Key": this.JSONBIN_MASTER_KEY } }
        );
        const data = await res.json();
        let list = Array.isArray(data.record) ? data.record : [];

        // 核心修复：遇到空标记，返回真正的空数组
        if (list.length === 1 && list[0]?.empty === true) {
          return [];
        }

        return list;
      } catch {
        return [];
      }
    },

    async openRestoreDialog() {
      const pass = await this.checkAdminPassword();
      if (!pass) return;
      this.restoreDialog = true;
      this.backupListLoading = true;
      try {
        const list = await this.loadAllBackupsPure();
        this.backupList = list;
      } finally {
        this.backupListLoading = false;
      }
    },

    async doRestore(backup) {
      this.$confirm("确定要回退到此备份吗？当前数据会被覆盖！", "警告", {
        confirmButtonText: "确定回退",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          try {
            this.loading = true;
            const { themeList, rankList } = backup.data;

            await fetch(`https://api.jsonbin.io/v3/b/${this.JSONBIN_BIN_ID}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "X-Master-Key": this.JSONBIN_MASTER_KEY,
              },
              body: JSON.stringify({ themeList, rankList }),
            });

            this.themeList = themeList;
            this.rankList = rankList;
            if (themeList.length) {
              this.currentThemeId = themeList[0].id;
              this.activeThemeId = this.currentThemeId + "";
            }
            this.$message.success("回退成功！已恢复数据");
          } catch (e) {
            this.$message.error("回退失败");
          } finally {
            this.loading = false;
            this.restoreDialog = false;
          }
        })
        .catch(() => {});
    },

    // ================== 增强备份功能：编辑备注 ==================
    openEditBackupNote(index, note) {
      this.editBackupIndex = index;
      this.editBackupNoteForm.note = note || "";
      this.editBackupNoteDialog = true;
    },

    async saveEditBackupNote() {
      const idx = this.editBackupIndex;
      if (idx < 0) return;
      const note = this.editBackupNoteForm.note?.trim() || "无说明";

      this.backupList[idx].note = note;
      await this.saveBackupListToCloud(this.backupList);
      this.$message.success("备注已更新");
      this.editBackupNoteDialog = false;
    },

    // ================== 增强备份功能：删除版本 ==================
    async deleteBackupVersion(index) {
      this.$confirm("确定删除此备份？删除后无法恢复", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          // 开启loading
          const loading = this.$loading({
            lock: true,
            text: "删除中...",
            background: "rgba(0,0,0,0.6)",
          });
          try {
            const newList = [...this.backupList];
            newList.splice(index, 1);
            // 先存云端
            await this.saveBackupListToCloud(newList);
            // 成功再更新页面
            this.backupList = newList;
            this.$message.success("删除成功");
          } catch (err) {
            this.$message.error("删除失败，请重试");
          } finally {
            // 关闭loading
            loading.close();
          }
        })
        .catch(() => {});
    },

    // ================== 增强备份功能：更新版本（用当前数据覆盖） ==================
    async updateBackupVersion(index) {
      this.$confirm("确定用【当前最新数据】覆盖此备份版本吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          const now = new Date();
          const timeStr = now
            .toLocaleString("zh-CN", { hour12: false })
            .replaceAll("/", "-");

          this.backupList[index].data = {
            themeList: JSON.parse(JSON.stringify(this.themeList)),
            rankList: JSON.parse(JSON.stringify(this.rankList)),
          };
          this.backupList[index].time = timeStr;

          await this.saveBackupListToCloud(this.backupList);
          this.$message.success("此备份已更新为当前最新数据");
        })
        .catch(() => {});
    },

    // ================== 统一保存备份列表到云端 ==================
    async saveBackupListToCloud(list) {
      try {
        // 核心修复：空数组时，存一个标记，而不是真的空
        const uploadData = Array.isArray(list)
          ? list.length === 0
            ? [{ empty: true }]
            : list
          : [];

        await fetch(
          `https://api.jsonbin.io/v3/b/${this.JSONBIN_BACKUP_BIN_ID}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Master-Key": this.JSONBIN_MASTER_KEY,
            },
            body: JSON.stringify(uploadData),
          }
        );
      } catch (e) {
        this.$message.error("保存备份列表失败");
      }
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
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.menu li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 拖拽终极高亮：深色底 + 文字加粗 + 上浮 + 阴影 */
::v-deep .el-table .dragging-row {
  font-weight: bold !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.2s ease !important;
}

/* 拖拽时才禁止表格文字选中，平时可以正常复制 */
.dragging-active ::v-deep .el-table__body-wrapper {
  user-select: none !important;
  -webkit-user-select: none !important;
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

.el-icon-rank {
  cursor: move !important;
  touch-action: none !important;
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