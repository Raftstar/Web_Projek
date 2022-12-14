import { useMediaQuery } from '@mui/material'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Container from '../components/Container'
import Modal from '../components/Modal'
import { CustomTab, CustomTabs } from '../components/mui/Tabs'
import OrderHistory from '../components/profile/OrderHistory'
import TopUpInformation from '../components/profile/TopUpInformation'
import UserBadge from '../components/UserBadge'
import Wrapper from '../components/Wrapper'
import request from '../lib/request'
import { User } from '../types/next-auth'

interface Props {
  user: User
}

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <div>{children}</div>}
    </div>
  )
}

const Profile = ({ user }: Props) => {
  const [tabIndex, setTabIndex] = useState(0)
  const [showFakeAdminModal, setShowFakeAdminModal] = useState(false)
  const changeTab = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex)
  }
  const onSmallScreen = useMediaQuery('(max-width: 420px)')

  const [displayName, setDisplayName] = useState(user.displayName ?? '')
  const router = useRouter()

  const beFakeAdminHandler = async () => {
    let toastId: string
    try {
      toastId = toast.loading('Processing...')
      await request.put(`/users/fakeAdmin`)
      toast.success("Congrats. Now you're a fake admin 🎉", { id: toastId })
      router.push(router.asPath, undefined, { shallow: false })
      setShowFakeAdminModal(false)
    } catch (err) {
      console.log(err)
      toast.error('Failed. Check console for details', { id: toastId })
    }
  }

  const removeFakeAdminHandler = async () => {
    let toastId: string
    try {
      toastId = toast.loading('Processing...')
      await request.put(`/users/fakeAdmin`)
      toast.success("Success, Now you're a normal user", { id: toastId })
      router.push(router.asPath, undefined, { shallow: false })
    } catch (err) {
      console.log(err)
      toast.error('Failed. Check console for details', { id: toastId })
    }
  }

  const saveUserDisplayName = async () => {
    let toastId: string
    try {
      toastId = toast.loading('Saving...')
      await request.put('/users/displayName', { displayName })
      toast.success('Saved', { id: toastId })
      router.push(router.asPath, undefined, { shallow: false })
    } catch (err) {
      toast.error('Failed. Check console for details', { id: toastId })
      console.log(err)
    }
  }

  return (
    <Container title={`${user.name}'s profile`}>
      <Wrapper className="flex flex-col md:flex-row md:items-start">
        <header className="md:flex-[1] md:pr-12 md:sticky md:top-[80px]">
          {/* USER PROFILE */}
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-start">
            {/* USER IMAGE */}
            <img
              className="rounded-full w-28 h-28 md:w-32 md:h-32 object-cover"
              src={user.image}
              alt={user.name}
            />
            {/* USER ROLE BADGE (MOBILE) */}
            <UserBadge
              role={user.role}
              className="md:hidden text-xs mt-4 px-2 py-1"
            />

            <div className="mt-3 md:mt-0 md:ml-10 text-center md:text-left">
              {/* USER NAME */}
              <h2 className="text-4xl font-bold flex items-center justify-center md:justify-start">
                {user.displayName || user.name}
                {/* USER ROLE BADGE (DESKTOP) */}
                <UserBadge
                  role={user.role}
                  className="hidden md:block ml-3 text-xs py-1"
                />
              </h2>

              <div>
                {user.displayName && (
                  <div className="text-gray-500 mt-1">{user.name}</div>
                )}
                {/* USER EMAIL */}
                <div className="text-gray-500 mt-1">{user.email}</div>
              </div>

              {user.role == 'USER' && (
                <button
                  onClick={() => setShowFakeAdminModal(true)}
                  className="mt-2 text-green-500 hover:underline font-medium"
                >
                  Be fake admin
                </button>
              )}

              {user.role == 'FAKE_ADMIN' && (
                <button
                  onClick={removeFakeAdminHandler}
                  className="mt-2 text-green-500 hover:underline font-medium"
                >
                  Remove fake admin
                </button>
              )}
            </div>
          </div>
          <div className="mt-8">
            {user.role != 'USER' && (
              <a
                href="/admin"
                target="_blank"
                className="block w-full md:max-w-[350px] mb-6 p-4 rounded-2xl border border-green-400 font-semibold bg-green-200 text-green-600 hover:bg-green-500 hover:text-white hover:shadow-xl hover:shadow-green-300 hover:-translate-y-1.5 transition-all dark:hover:shadow-green-300/10 dark:bg-green-500 dark:text-white"
              >
                Go to Admin Dashboard &rarr;
              </a>
            )}

            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold">Edit Profile</h3>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="block text-gray-500 text-sm mb-1">
                    Display Name
                  </span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    type="text"
                    className="input"
                    placeholder=""
                  />
                </label>
              </div>
              <button
                className="mt-5 text-green-500 font-semibold hover:underline"
                onClick={saveUserDisplayName}
              >
                Save
              </button>
            </div>
          </div>
        </header>

        <div className="mt-8 md:flex-[1]">
          <CustomTabs
            value={tabIndex}
            onChange={changeTab}
            variant={onSmallScreen ? 'scrollable' : 'fullWidth'}
          >
            <CustomTab label="Order History" />
            <CustomTab label="Topup Information" />
          </CustomTabs>
          <div className="mt-5">
            <TabPanel value={tabIndex} index={0}>
              <OrderHistory />
            </TabPanel>
            <TabPanel value={tabIndex} index={1}>
              <TopUpInformation user={user} />
            </TabPanel>
          </div>
        </div>
      </Wrapper>
      <Modal
        open={showFakeAdminModal}
        onClose={() => setShowFakeAdminModal(false)}
      >
        <h2 className="p-5 text-xl font-medium">Fake Admin ?</h2>
        <div className="p-5 pt-0">
          <p>
            By being a fake admin, you can access admin dashboard page <br />{' '}
            BUT you can&apos;t do all admin operations
          </p>
          <div className="mt-5 space-x-3">
            <button
              onClick={beFakeAdminHandler}
              className="bg-green-500 hover:bg-green-400 text-white font-medium px-3 py-1 rounded-md"
            >
              Continue
            </button>
            <button
              onClick={() => setShowFakeAdminModal(false)}
              className="bg-red-500 hover:bg-red-400 text-white font-medium px-3 py-1 rounded-md"
            >
              Nevermind
            </button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}

export default Profile

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const session = await getSession({ req })
  if (!session) {
    return {
      redirect: {
        destination: '/signin',
        permanent: false,
      },
    }
  }

  const { order_id } = query
  if (order_id) {
    return {
      redirect: {
        destination: `/order?orderId=${order_id}`,
        permanent: false,
      },
    }
  }

  return {
    props: {
      user: session.user,
    },
  }
}
