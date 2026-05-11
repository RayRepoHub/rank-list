<template>
  <div id="app" style="padding: 20px; background: #f5f7fa; min-height: 100vh">
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
          新建主题
        </el-button>

        <el-menu :default-active="activeThemeId" class="menu">
          <el-menu-item
            v-for="item in themeList"
            :key="item.id"
            :index="item.id + ''"
            @click="switchTheme(item.id)"
          >
            <span style="flex: 1">{{ item.name }}</span>
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
          <el-button
            type="success"
            icon="el-icon-plus"
            @click="addRankItem"
            style="float: right"
          >
            添加排名
          </el-button>
        </div>

        <el-table :data="currentRankList" border style="width: 100%">
          <el-table-column label="排名" prop="rank" width="80" align="center" />
          <el-table-column label="名称" prop="name" />
          <el-table-column label="描述" prop="desc" />
          <el-table-column label="操作" width="180" align="center">
            <template slot-scope="scope">
              <el-button size="mini" type="primary" @click="editItem(scope.row)"
                >编辑</el-button
              >
              <el-button
                size="mini"
                type="danger"
                @click="deleteItem(scope.row.id)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 主题 新增/编辑 弹窗 -->
    <el-dialog :visible.sync="themeDialog" title="主题信息">
      <el-input v-model="themeForm.name" placeholder="请输入主题名称" />
      <div slot="footer" class="dialog-footer">
        <el-button @click="themeDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTheme">确认保存</el-button>
      </div>
    </el-dialog>

    <!-- 排名编辑弹窗 -->
    <el-dialog :visible.sync="itemDialog" title="编辑排名">
      <el-form label-width="80px">
        <el-form-item label="排名">
          <el-input v-model.number="itemForm.rank" type="number" />
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
export default {
  name: "App",
  data() {
    return {
      // ========== JSONBIN 配置（你必须改成自己的！）==========
      JSONBIN_MASTER_KEY: "$2a$10$Z9GMvjcEgBICbobvUeAOp.m7Wg/8FiUiblHXiv7XfVrpxAMEwOz3W",
      JSONBIN_BIN_ID: "6a01e01cc0954111d8098878",

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
    this.loadAllData(); // 页面加载自动拉取云端数据
  },
  methods: {
    // ==============================================
    // 1. 从 JSONBIN 加载所有数据
    // ==============================================
    async loadAllData() {
      try {
        const res = await fetch(
          `https://api.jsonbin.io/v3/b/${this.JSONBIN_BIN_ID}/latest`,
          {
            headers: {
              "X-Master-Key": this.JSONBIN_MASTER_KEY,
            },
          }
        );
        const data = await res.json();
        const { themeList, rankList } = data.record;

        this.themeList = themeList || [];
        this.rankList = rankList || {};

        if (this.themeList.length > 0) {
          this.currentThemeId = this.themeList[0].id;
        }
        this.$message.success("数据加载成功");
      } catch (err) {
        this.$message.error("加载失败");
        console.error(err);
      }
    },

    // ==============================================
    // 2. 保存所有数据到 JSONBIN
    // ==============================================
    async saveAllData() {
      try {
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
        return true;
      } catch (err) {
        this.$message.error("保存失败");
        console.error(err);
        return false;
      }
    },

    // ==============================================
    // 主题相关
    // ==============================================
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

    async saveTheme() {
      if (!this.themeForm.name) return this.$message.warning("请输入主题名");

      if (this.editThemeId) {
        // 编辑
        const index = this.themeList.findIndex(
          (t) => t.id === this.editThemeId
        );
        this.themeList[index].name = this.themeForm.name;
      } else {
        // 新增
        const newId = Math.max(...this.themeList.map((t) => t.id), 0) + 1;
        this.themeList.push({ id: newId, name: this.themeForm.name });
        this.rankList[newId] = [];
      }

      const ok = await this.saveAllData();
      if (ok) {
        this.$message.success("主题保存成功");
        this.themeDialog = false;
      }
    },

    async deleteTheme(id) {
      this.$confirm("确定删除该主题吗？删除后排名也会清空！", "提示").then(
        async () => {
          this.themeList = this.themeList.filter((t) => t.id !== id);
          delete this.rankList[id];

          if (this.currentThemeId === id) {
            this.currentThemeId = this.themeList[0]?.id || 0;
          }

          const ok = await this.saveAllData();
          if (ok) this.$message.success("删除成功");
        }
      );
    },

    // ==============================================
    // 排名相关
    // ==============================================
    addRankItem() {
      this.editItemId = null;
      this.itemForm = { rank: "", name: "", desc: "" };
      this.itemDialog = true;
    },

    editItem(row) {
      this.editItemId = row.id;
      this.itemForm = { ...row };
      this.itemDialog = true;
    },

    async saveItem() {
      const list = this.rankList[this.currentThemeId];
      if (this.editItemId) {
        const index = list.findIndex((i) => i.id === this.editItemId);
        list[index] = { ...this.itemForm, id: this.editItemId };
      } else {
        const newId = Math.max(...list.map((i) => i.id || 0), 0) + 1;
        list.push({ ...this.itemForm, id: newId });
      }

      const ok = await this.saveAllData();
      if (ok) {
        this.itemDialog = false;
        this.$message.success("保存成功");
      }
    },

    async deleteItem(id) {
      this.$confirm("确定删除？").then(async () => {
        const list = this.rankList[this.currentThemeId];
        this.rankList[this.currentThemeId] = list.filter((i) => i.id !== id);
        const ok = await this.saveAllData();
        if (ok) this.$message.success("删除成功");
      });
    },
  },
};
</script>

<style scoped>
.layout {
  display: flex;
  max-width: 1200px;
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
</style>