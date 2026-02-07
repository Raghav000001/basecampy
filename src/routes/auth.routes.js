import e from "express";
import { registerUser , loginUser, verifyEmail, refreshAccessToken, logoutUser, getCurrentUser, changeCurrentPassword, resendVerificationEmail, deleteAllUser, softDelete, getAllUser, restoreSoftDeletedUser, setUserStatusActiveInBulk, mixBulk} from "../controllers/auth.controllers.js";
import { changeCurrentPasswordValidator, userLoginValidator, userRegisterValidator } from "../validators/validator.js";
import { validate } from "../middleware/validator.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = e.Router()

router.route("/register").post(userRegisterValidator(),validate,registerUser)
router.route("/login").post(userLoginValidator(),validate,loginUser)

router.route('/verify-email/:verificationToken').get(verifyEmail)
router.route("/refresh-token").post(refreshAccessToken)

// testing purpose
router.route("/delete-all-users").delete(deleteAllUser)
router.route("/update-in-bulk").put(setUserStatusActiveInBulk)
router.route("/mix-bulk").put(mixBulk)



// secure routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/current-user").post(verifyJWT,getCurrentUser)
router.route("/change-password").post(
    verifyJWT,
    changeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword
)

// soft delete route
router.route("/soft-delete").post(softDelete)
router.route("/restore-soft-delete").post(restoreSoftDeletedUser)
router.route("/get-all-users").get(getAllUser)

router
  .route("/resend-email-verification")
  .post(
      verifyJWT,
      resendVerificationEmail
  )



export default router