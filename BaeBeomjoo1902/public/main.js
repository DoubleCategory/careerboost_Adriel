window.onload = () => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      tableContents.logined = true;

      const userId = firebase.auth().currentUser.uid;

      firebase
        .database()
        .ref("todolist/" + userId)
        .on("child_added", data => {
          const resultObject = {
            name: data.val().name,
            text: data.val().text,
            state: data.val().state,
            priority: data.val().priority,
            date: data.val().date,
            key: data.key
          };
          tableContents.todoList.push(resultObject);
        });

      firebase
        .database()
        .ref("todolist/" + userId)
        .on("child_changed", data => {
          for (let i = 0; i < tableContents.todoList.length; i++) {
            if (tableContents.todoList[i].key === data.key) {
              tableContents.todoList[i].state = data.val().state;
              break;
            }
          }
        });
    } else {
      tableContents.logined = false;
      tableContents.todoList = [];
    }
  });
};

const tableContents = {
  logined: false,

  isButtonDisabled: false,
  isAddToDoMenu: false,

  states: ["TODO", "DOING", "DONE"],

  sendObject: {
    text: "",
    priority: "1",
    name: ""
  },

  todoList: []
};

Vue.component("my-component", {
  template: `<div v-if="!logined">
  <button v-on:click="login">google login</button>
</div>

<div v-else-if="logined && !isAddToDoMenu">
  <div>
    <br>
    <br>
    <button style="margin-left: 60%;" v-bind:disabled="isButtonDisabled" v-on:click="clickAddTodo">새로운 TODO
      등록</button>
    <button v-bind:disabled="isButtonDisabled" v-on:click="logout">logout</button>
    <br>
    <br>
    <div class="title">나의 해야할 일들</div>

  </div>
  <br>
  <div class="row" v-for="state in states">
    <div class="top">
      <div>{{state}}</div>
    </div>
    <div class="todo" v-for="content in todoList" v-if="content.state === state">
      <div>{{content.text}}</div>
      <br>
      <div>등록날짜 {{content.date}}, {{content.name}}, 우선순위{{content.priority}}</div>
      <button v-bind:disabled="isButtonDisabled" v-if="state !='DONE'"
        v-on:click="moveToRight(content.key,content.state)">></button>
    </div>
  </div>
</div>

<div class="addtodo-menu" v-else-if="isAddToDoMenu">
  <h1>할일 등록</h1>
  <form>
    <label>어떤일인가요?</label>
    <br>
    <input type="text" maxLength="24" placeholder="Vue 공부하기(24자까지)" v-model="sendObject.text" />
    <br><br>
    <label>누가 할일인가요?</label>
    <br>
    <input type="text" maxLength="20" placeholder="홍길동" v-model="sendObject.name" />
    <br><br>
    <label>우선순위를 선택하세요</label>
    <input type="radio" id="one" value="1" v-model="sendObject.priority">
    <label for="one">1</label>
    <input type="radio" id="one" value="2" v-model="sendObject.priority">
    <label for="one">2</label>
    <input type="radio" id="one" value="3" v-model="sendObject.priority">
    <label for="one">3</label>
    <br>
  </form>
  <div>
    <button v-bind:disabled="isButtonDisabled" v-on:click="backToTable">이전</button>
    <button v-bind:disabled="isButtonDisabled" v-on:click="addToDoList">제출</button>
    <button v-bind:disabled="isButtonDisabled" v-on:click="removeToDoList">내용지우기</button>
  </div>

</div>`,
  data() {
    return tableContents;
  },
  methods: {
    login() {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider);
    },
    logout() {
      firebase.auth().signOut();
    },
    clickAddTodo() {
      this.isAddToDoMenu = true;
    },
    backToTable() {
      this.isAddToDoMenu = false;
    },
    removeToDoList() {
      this.sendObject = {
        text: "",
        priority: "1",
        name: ""
      };
    },
    addToDoList() {
      this.isButtonDisabled = true;

      const addToDoList = firebase.functions().httpsCallable("addToDoList");
      addToDoList(this.sendObject)
        .then(result => {
          this.isButtonDisabled = false;
          this.backToTable();
          this.removeToDoList();
        })
        .catch(error => {
          const { code, message, details } = error;

          console.error(
            "There was an error when calling the Cloud Function",
            error
          );
          window.alert(
            "There was an error when calling the Cloud Function:\n\nError Code: " +
              code +
              "\nError Message:" +
              message +
              "\nError Details:" +
              details
          );
          this.isButtonDisabled = false;
          this.backToTable();
          this.removeToDoList();
        });
    },
    moveToRight(key, state) {
      this.isButtonDisabled = true;
      const moveToRight = firebase.functions().httpsCallable("moveToRight");
      moveToRight({ key: key, state: state })
        .then(result => {
          this.isButtonDisabled = false;
        })
        .catch(error => {
          const { code, message, details } = error;

          console.error(
            "There was an error when calling the Cloud Function",
            error
          );
          window.alert(
            "There was an error when calling the Cloud Function:\n\nError Code: " +
              code +
              "\nError Message:" +
              message +
              "\nError Details:" +
              details
          );
          this.isButtonDisabled = false;
        });
    }
  }
});

const appEl = new Vue({
  el: "#app"
});
