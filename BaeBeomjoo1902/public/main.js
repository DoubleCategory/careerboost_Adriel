

window.onload = function () {

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            tableContents.logined = true;

            var userId = firebase.auth().currentUser.uid;

            firebase.database().ref('todolist/' + userId).on('child_added', function (data) {

                var resultObject = {
                    name: data.val().name,
                    text: data.val().text,
                    state: data.val().state,
                    priority: data.val().priority,
                    date: data.val().date,
                    key: data.key,
                }
                app.todoList.push(resultObject);
            });

            firebase.database().ref('todolist/' + userId).on('child_changed', function (data) {
                console.log("child_changed: " + data.key);
                for(var i=0;i<app.todoList.length;i++){
                    if(app.todoList[i].key === data.key){
                        app.todoList[i].state = data.val().state;
                        break;
                    }
                }
            });


        } else {
            tableContents.logined = false;
            app.todoList = [];
        }
    });
};

// ES6 변수 지정 키워드인 const 혹은 let을 사용하시길 권장드립니다.
var tableContents = {

    logined: false,

    isButtonDisabled: false,
    isAddToDoMenu: false,

    states: ["TODO", "DOING", "DONE"],

    sendObject: {
        text: "",
        priority: "1",
        name: ""
    },

    todoList: [
    ]

}

var app = new Vue({
    el: '#app',
    data: tableContents,
    methods: {
        login: function () {
            var provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider);
        },
        logout: function () {
            firebase.auth().signOut();
        },
        clickAddTodo: function () {
            this.isAddToDoMenu = true;
        },
        backToTable: function () {
            this.isAddToDoMenu = false;
        },
        removeToDoList: function () {
            this.sendObject = {
                text: "",
                priority: "1",
                name: ""
            }
        },
        addToDoList: function () {

            this.isButtonDisabled = true;
            console.log(this.sendObject);
            var addToDoList = firebase.functions().httpsCallable('addToDoList');
            addToDoList(this.sendObject).then(function (result) {

                this.isButtonDisabled = false;
                this.backToTable();
                this.removeToDoList();
                console.log(result);

            }.bind(this)).catch(function (error) {

                var code = error.code;
                var message = error.message;
                var details = error.details;
                // const { code, message, details } = error; ES6의 구조분해할당을 쓸 수 있습니다.
                
                console.error('There was an error when calling the Cloud Function', error);
                window.alert('There was an error when calling the Cloud Function:\n\nError Code: '
                    + code + '\nError Message:' + message + '\nError Details:' + details);
                this.isButtonDisabled = false;
                this.backToTable();
                this.removeToDoList();

            }.bind(this));

        },
        moveToRight: function (key, state) {
        // moveToRight(key, state) {
            // 메소드는 이렇게 선언할 수도 있습니다.
        // }
            this.isButtonDisabled = true;
            var moveToRight = firebase.functions().httpsCallable('moveToRight');
            moveToRight({ key: key, state: state }).then(function (result) {
                // ES6 함수 선언식인 화살표 함수 사용을 추천드립니다. () => { return; }
                console.log(result);
                this.isButtonDisabled = false;

            }.bind(this)).catch(function (error) {
                
                var code = error.code;
                var message = error.message;
                var details = error.details;
                
                console.error('There was an error when calling the Cloud Function', error);
                window.alert('There was an error when calling the Cloud Function:\n\nError Code: '
                    + code + '\nError Message:' + message + '\nError Details:' + details);
                this.isButtonDisabled = false;

            }.bind(this));
        },
    }
})