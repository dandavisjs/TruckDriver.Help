import { getSession } from 'next-auth/react';
import classes from "./account.module.css";
import ProfilePassword from '../../components/profile/profile';
import Sidebar from '../../components/profile/sidebar';

function Account() {
    return (
        <div className={classes.main}>
            {/* <ProfilePassword /> */}
            <div>
                <ProfilePassword />
            </div>

            <Sidebar />
        </div>
    )
}

export async function getServerSideProps(context) {
    const session = await getSession({ req: context.req });
    // Redirect if user isn't logged in
    if (!session) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        };
    }

    return {
        props: { session },

    };



}

export default Account;

