import { LoginState } from "@/app/page";
import { default as LoginForm, LoginPayload } from "../LoginForm";
import { Dispatch, SetStateAction } from "react";

type LoginPanelProps = {
    loginUseState: [ LoginState, Dispatch<SetStateAction<LoginState>> ];
    statusLoading: boolean;
}

export default function LoginPanel({ loginUseState, statusLoading }: LoginPanelProps) {
    const [loginState, setLoginState] = loginUseState;
    async function loginDefenderData(loginPayload: LoginPayload) {
        const res = await fetch('/api/login/defData', {
            method: 'POST',
            body: JSON.stringify(loginPayload),
            headers: {
                'Content-type': 'application/json'
            }
        });

        setLoginState({ ...loginState, dd: res.status === 200 });
    }

    async function loginJIC(loginPayload: LoginPayload) {
        const res = await fetch('/api/login/tn3270', {
            method: 'POST',
            body: JSON.stringify(loginPayload),
            headers: {
                'Content-type': 'application/json'
            }
        });

        if (loginPayload.service === 'S_JIC')
            setLoginState({ ...loginState, sc: res.status === 200 });
        else if (loginPayload.service === 'F_JIC')
            setLoginState({ ...loginState, fc: res.status === 200 });
    }

    async function logout(service: string) {
        const logoutResponse = await fetch(`/api/logout?service=${service}`);
        if (await logoutResponse.text() !== 'OK') {
            console.error('Logout failed:', service);
        }

        switch (service) {
            case 'DD':
                setLoginState({ ...loginState, dd: false });
                break;
            case 'S_JIC':
                setLoginState({ ...loginState, sc: false });
                break;
            case 'F_JIC':
                setLoginState({ ...loginState, fc: false });
                break;
            case 'ALL':
                setLoginState({});
                break;
        }
    }

    return (
        <div className="relative w-80 bg-white dark:bg-gray-700 h-screen shadow-xl overflow-y-auto">
            { statusLoading && <div className="absolute inset-0 bg-gray-700 z-50 p-4">Loading login status...</div> }
            
            <div className="p-4 bg-linear-to-r from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-600
                            shadow-md rounded-b-xl border-b border-gray-200 dark:border-gray-700">
                <h1 className="flex items-center justify-between text-2xl font-bold text-gray-900 dark:text-white">
                    <span className="tracking-tight">Login</span>
                    <div className="flex items-center space-x-3 ml-4">
                        { loginState.dd && <img src="./icons/dd.svg" className="w-8 cursor-pointer" onClick={ e => logout('DD') } /> }
                        { loginState.sc && <img src="./icons/sc.svg" className="w-8 cursor-pointer" onClick={ e => logout('S_JIC') } /> }
                        { loginState.fc && <img src="./icons/fc.svg" className="w-8 cursor-pointer" onClick={ e => logout('F_JIC') } /> }
                        { Object.values(loginState).some(v => v) && <img src="./icons/logout.svg" className="w-8 cursor-pointer" onClick={ e => logout('ALL') } /> }
                    </div>
                </h1>
            </div>

            <div> 
                { !loginState.dd && 
                    <LoginForm 
                        title="Defender Data" 
                        fieldPrefix="DD"
                        loginUpdate={loginDefenderData}
                    />
                }

                { !loginState.sc && 
                    <LoginForm 
                        title="Superior Court JIC" 
                        fieldPrefix="S_JIC" 
                        loginUpdate={loginJIC}
                    />
                }
                
                { !loginState.fc && 
                    <LoginForm 
                        title="Family Court JIC" 
                        fieldPrefix="F_JIC"
                        loginUpdate={loginJIC}
                    />
                }
            </div>

        </div>
    );
}