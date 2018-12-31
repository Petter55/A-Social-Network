import { connect } from 'react-redux'
import PostBox from './PostBox'
import add_post from '../../store/actions/post_add'

const mapStateToProps = (state) => ({
  posts: state.loggedin.posts
})

const mapDispatchToProps = (dispatch) => ({
  add_post: (post) => {  dispatch(add_post(post)) }
})

const PostBoxContainer = connect(mapStateToProps, mapDispatchToProps)(PostBox)

export default PostBoxContainer
