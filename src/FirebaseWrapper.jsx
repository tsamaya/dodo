import React, { useContext, useEffect, useMemo, useState } from 'react';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import {
  useCollection,
  useCollectionData,
} from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { googleAuthContext } from 'GoogleAuth';
import {
  FIREBASE_APIKEY,
  FIREBASE_AUTHDOMAIN,
  FIREBASE_DATABASEURL,
  FIREBASE_PROJECTID,
  FIREBASE_STORAGEBUCKET,
  FIREBASE_MESSAGINGSENDERID,
  FIREBASE_APPID,
} from './credentials';

const firebaseConfig = {
  apiKey: FIREBASE_APIKEY,
  authDomain: FIREBASE_AUTHDOMAIN,
  databaseURL: FIREBASE_DATABASEURL,
  projectId: FIREBASE_PROJECTID,
  storageBucket: FIREBASE_STORAGEBUCKET,
  messagingSenderId: FIREBASE_MESSAGINGSENDERID,
  appId: FIREBASE_APPID,
  // measurementId: "G-LJ4NS3TVPX",
};
firebase.initializeApp(firebaseConfig);

const tasksContext = React.createContext({
  tasks: [],
  contexts: [],
  tags: [],
  contextColors: {},
  tagColors: {},
  addTask: () => {},
  removeTask: () => {},
});
export { tasksContext };

const FirebaseWrapperWrapper = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const { token, email } = useContext(googleAuthContext);

  useEffect(() => {
    if (token) {
      const firebaseUser = firebase.auth.GoogleAuthProvider.credential(token);
      setFirebaseUser(firebaseUser);
    } else {
      firebase.auth().signOut();
      setFirebaseUser(null);
    }
  }, [token]);

  if (!firebaseUser) return null;

  return <FirebaseWrapper {...{ email, token, children }} />;
};

export default FirebaseWrapperWrapper;

const colors = [
  '#8e44ad',
  '#3dc1d3',
  '#833471',
  '#4a69bd',
  '#1B1464',
  '#c44569',
  '#f39c12',
  '#16a085',
  '#d35400',
  '#60a3bc',
];

const FirebaseWrapper = ({ email, token, children }) => {
  const tasksSnapshot = useMemo(
    () => email && firebase.firestore().collection(`users/${email}/tasks`),
    [email]
  );
  const [tasksCollection] = useCollection(tasksSnapshot);
  const [tasks, isLoading, didError] = useCollectionData(tasksSnapshot, {
    idField: 'id',
  });

  const addTask = task => {
    tasksSnapshot.add(task);
  };
  const removeTask = task => {
    console.log(tasksSnapshot, tasksCollection, tasksSnapshot.doc(task.id));
    tasksSnapshot.doc(task.id).delete();
  };

  const contexts = useMemo(() => {
    return [
      ...new Set((tasks || []).map(task => task.context).flat(Infinity)),
    ].filter(d => d);
  }, [tasks]);
  const tags = useMemo(() => {
    return [
      ...new Set((tasks || []).map(task => task.tags).flat(Infinity)),
    ].filter(d => d);
  }, [tasks]);

  const contextColors = useMemo(
    () =>
      Object.fromEntries(
        contexts.map((d, i) => [d, colors[i % colors.length]])
      ),
    [contexts]
  );

  const tagColors = useMemo(
    () =>
      Object.fromEntries(tags.map((d, i) => [d, colors[i % colors.length]])),
    [tags]
  );

  const contextValue = useMemo(
    () => ({
      tasks: tasks || [],
      contexts: contexts || [],
      tags: tags || [],
      contextColors: contextColors || {},
      tagColors: tagColors || {},
      addTask,
      removeTask,
    }),
    [tasks, contexts, tags, contextColors, tagColors, addTask, removeTask]
  );

  return (
    <tasksContext.Provider value={contextValue}>
      {children}
    </tasksContext.Provider>
  );
};
