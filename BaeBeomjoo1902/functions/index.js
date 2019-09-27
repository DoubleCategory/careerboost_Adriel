const functions = require('firebase-functions');
const admin = require('firebase-admin');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
admin.initializeApp();

exports.addToDoList = functions.https.onCall((data, context) => {

    const name = data.name;
    const text = data.text;
    const priority = data.priority;
    if (!(typeof name === 'string') || name.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'invalid name');
    }
    if (!(typeof text === 'string') || text.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'invalid text');
    }
    if (!(typeof priority === 'string') || priority < 1 || priority > 3) {
        throw new functions.https.HttpsError('invalid-argument', 'invalid priority');
    }
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
            'while authenticated.');
    }

    const date = moment().format('YYYY.MM.DD');
    const uid = context.auth.uid;

    return admin.database().ref('/todolist/' + uid).push({
        name: name,
        text: text,
        state: "TODO",
        date: date,
        priority: priority
        // name,
        // text,
        // state: "TODO",
        // date,
        // priority
        // 위 처럼 약식으로 처리할 수 있습니다.
    }).then(() => {
        return true;
    })
        .catch((error) => {
            throw new functions.https.HttpsError('unknown', error.message, error);
        });
    // 위에 부분이 포맷팅이 필요해보입니다. prettier같은 플러그인을 사용하시길 추천드립니다.
});

exports.moveToRight = functions.https.onCall((data, context) => {

    const key = data.key;
    const state = data.state;

    if (!(typeof key === 'string') || key.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'invalid key');
    }
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
            'while authenticated.');
    }
    const uid = context.auth.uid;

    var nextState = "";
    if (state === "TODO") {
        nextState = "DOING";
    } else if (state === "DOING") {
        nextState = "DONE";
    } else {
        return false;
    }

    return admin.database().ref('/todolist/' + uid + '/' + key).update({
        state: nextState
    }).then(() => {
        return true;
    })
        .catch((error) => {
            throw new functions.https.HttpsError('unknown', error.message, error);
        });
});