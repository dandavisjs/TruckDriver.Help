import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import classes from './auth-form.module.css';
import { useContext } from 'react';
import UserContext from '../../store/user-context';
import AuthContext from '../../store/auth-context'
import Link from 'next/link';

async function createUser(email, password) {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong!');
  }

  return data;
}

function AuthForm({ token }) {
  const userCtx = useContext(UserContext);
  const emailInputRef = useRef();
  const resetEmailInputRef = useRef();
  const passwordInputRef = useRef();
  const passwordVerifyInputRef = useRef();
  const { error } = useRouter().query;
  const [isLogin, setIsLogin] = useState(true);
  const [forgot, setForgot] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [checkedAgreement, setCheckedAgreement] = useState(false);
  const router = useRouter();
  const authCtx = useContext(AuthContext)
  const { setAuth } = authCtx

  {
    error && console.log(error);
  }

  function switchAuthModeHandler() {
    passwordInputRef.current.value = ''
    passwordVerifyInputRef.current ? passwordVerifyInputRef.current.value = '' : null
    setIsLogin((prevState) => !prevState);
  }

  function switchForgotModeHandler() {
    setForgot((prevState) => !prevState);
  }

  async function submitHandler(event) {
    event.preventDefault();

    const enteredEmail = emailInputRef.current.value;
    const enteredPassword = passwordInputRef.current.value;

    // optional: Add validation

    if (isLogin) {
      const res = await signIn('credentials', {
        redirect: false,
        email: enteredEmail,
        password: enteredPassword,
        token: token ? token : null,
      });

      if (!res.error) {
        const user = await fetch(`/api/user/${enteredEmail}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enteredEmail),
        });

        user.json().then((body) =>
          userCtx.setUser({
            ...body,
          })
        );

        // const notification = await fetch(`/api/notification/add`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ message: "?????????????? ???? ??????????????????????!" }),
        // })
        setAuth()
        router.replace('/');
      } else {
        setErrorMessage(res.error);
        setTimeout(() => {
          setErrorMessage('');
        }, 10000);
      }
    } else {
      const enteredPasswordVerify = passwordVerifyInputRef.current.value;
      if (!checkedAgreement) {
        setErrorMessage(
          '???? ???????????? ?????????????????????? ?? ?????????????????? ?????????????????????????????????? ????????????????????.'
        );
        setTimeout(() => {
          setErrorMessage('');
        }, 10000);
        return;
      }
      if (enteredPassword !== enteredPasswordVerify) {
        setErrorMessage(
          '?????????????????? ???????????? ???? ??????????????????!'
        );
        setTimeout(() => {
          setErrorMessage('');
        }, 10000);
        return;
      }
      if (enteredPassword < 7) {
        setErrorMessage(
          '???????????????????? ???????????? ???????????? ?????????????? ???? 7 ????????????.'
        );
        setTimeout(() => {
          setErrorMessage('');
        }, 10000);
        return;
      }
      try {
        const res = await createUser(enteredEmail, enteredPassword);
        console.log(res.error);
        if (!res.error) {
          setConfirmMessage('???????????? ?? ???????????????????????????? ???????????????????? ???? ??????????');
          setRegistered(true)
          setTimeout(() => {
            setConfirmMessage('');
          }, 10000);
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  const sendEmail = async (event) => {
    event.preventDefault();

    const resetEmail = resetEmailInputRef.current.value;

    try {
      let body = {
        email: resetEmail,
      };
      await fetch(`/api/auth/sendReset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setMessage(
        '???????????? ?????? ?????????????????????????? ???????????????? ???????????????????? ???? ?????????????????? ??????????.'
      );
      setTimeout(() => {
        setMessage('');
      }, 10000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={classes.auth}>
      {!forgot ? (
        <>
          <h3>{isLogin ? '??????????????????????' : '??????????????????????'}</h3>
          {token && (
            <span style={{ color: 'red' }}>
              ?????????????? ?? ?????????????? ?????? ???????????????????? ??????????????????????????!
            </span>
          )}
          {registered && (
            <span style={{ color: 'red' }}>
              ???????? ???? ???? ???????????????? ????????????, ?????????????????? ?????????? {'"????????"'}.
            </span>
          )}
          <form onSubmit={submitHandler}>
            <div className={classes.control}>
              <label htmlFor='email'>Email</label>
              <input type='email' id='email' required ref={emailInputRef} />
            </div>
            <div className={classes.control}>
              <label htmlFor='password'>????????????</label>
              <input
                type='password'
                id='password'
                required
                ref={passwordInputRef}
              />
            </div>
            {isLogin ? null : <div className={classes.control}>
              <label htmlFor='password'>?????????????????????? ????????????</label>
              <input
                type='password'
                id='confirmPassword'
                required
                ref={passwordVerifyInputRef}
              />
            </div>}
            {errorMessage && (
              <span style={{ color: 'red' }}>{errorMessage}</span>
            )}
            {confirmMessage && (
              <span style={{ color: 'green' }}>{confirmMessage}</span>
            )}
            {!isLogin && (
              <div style={{ width: 200 }}>
                <input
                  type='checkbox'
                  id='agreement'
                  name='agreement'
                  onChange={(e) => setCheckedAgreement(e.target.checked)}
                ></input>
                <label htmlFor='agreement'>
                  C?????????????? ?? ?????????????????? ??????????????????????????????????{' '}
                  <Link href={{ pathname: `/help/terms` }}>
                    <a
                      style={{ color: '#3C3C77', textDecoration: 'underline' }}
                      target='_blank'
                    >
                      ????????????????????
                    </a>
                  </Link>
                  .
                </label>
              </div>
            )}
            <button>{isLogin ? '??????????' : '??????????????????????'}</button>

            <button
              type='button'
              className={classes.buttonText}
              onClick={switchAuthModeHandler}
            >
              {isLogin ? '??????????????????????' : '??????????'}
            </button>
          </form>
        </>
      ) : (
        <div className={classes.auth}>
          {!forgot ? <>

            <h3>{isLogin ? '??????????????????????' : '??????????????????????'}</h3>
            {token && <p style={{ color: 'red' }}>?????????????? ?? ?????????????? ?????? ???????????????????? ??????????????????????????!</p>}
            <form onSubmit={submitHandler}>
              <div className={classes.control}>
                <label htmlFor='email'>Email</label>
                <input type='email' id='email' required ref={emailInputRef} />
              </div>
              <div className={classes.control}>
                <label htmlFor='password'>????????????</label>
                <input type='password' id='password' required ref={passwordInputRef} />
              </div>
              {errorMessage && <span style={{ color: 'red' }}>{errorMessage}</span>}
              {confirmMessage && <span style={{ color: 'green' }}>{confirmMessage}</span>}
              {!isLogin &&
                <div >
                  <input type="checkbox" id="agreement" name="agreement" onChange={e => setCheckedAgreement(e.target.checked)}></input>
                  <label htmlFor="agreement">C?????????????? ?? ?????????????????? ?????????????????????????????????? <Link href={{ pathname: `/help/terms` }}><a style={{ color: '#3C3C77', textDecoration: 'underline' }} target="_blank" rel="noreferrer">????????????????????</a></Link>.</label>
                </div>}
              <div className={classes.actions}>
                <button>{isLogin ? '??????????' : '??????????????????????'}</button>
                <button
                  type='button'
                  className={classes.buttonText}
                  onClick={switchAuthModeHandler}
                >
                  {isLogin ? '??????????????????????' : '??????????'}
                </button>
              </div>

            </form>

          </> :
            <div className={classes.auth}>
              <form onSubmit={sendEmail}>
                <h3>?????????????????????? ????????????</h3>
                <div className={classes.control}>
                  <label htmlFor='resetEmail'>Email</label>
                  <input type='email' id='resetEmail' required ref={resetEmailInputRef} />
                </div>
                {message && <span style={{ color: 'green' }}>{message}</span>}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button>??????????????????</button>

                </div>
              </form>
            </div>}

        </div>
      )}
      <div>
        <button
          className={classes.buttonText}
          onClick={switchForgotModeHandler}
          type='button'
          style={{ color: '#404040' }}
        >
          {!forgot ? '???????????? ?????????????' : '?????????? ?? ??????????????'}
        </button>
      </div>
    </div>
  );
}

export default AuthForm;
