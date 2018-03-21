import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {withRouter} from 'react-router'
import _ from 'lodash'
import {getSource} from 'shared/apis'
import {createSource, updateSource} from 'shared/apis'
import {
  addSource as addSourceAction,
  updateSource as updateSourceAction,
} from 'shared/actions/sources'
import {notify as notifyAction} from 'shared/actions/notifications'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import Notifications from 'shared/components/Notifications'
import SourceForm from 'src/sources/components/SourceForm'
import FancyScrollbar from 'shared/components/FancyScrollbar'
import SourceIndicator from 'shared/components/SourceIndicator'
import {DEFAULT_SOURCE} from 'shared/constants'
const initialPath = '/sources/new'

import {
  NOTIFY_ERROR_CONNECTING_TO_SOURCE,
  NOTIFY_SOURCE_CREATION_SUCCEEDED,
  NOTIFY_SOURCE_CREATION_FAILED,
  NOTIFY_SOURCE_UPDATED,
  NOTIFY_SOURCE_UPDATE_FAILED,
} from 'shared/copy/notifications'

class SourcePage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isLoading: true,
      source: DEFAULT_SOURCE,
      editMode: props.params.id !== undefined,
      isInitialSource: props.router.location.pathname === initialPath,
    }
  }

  componentDidMount() {
    const {editMode} = this.state
    const {params, notify} = this.props

    if (!editMode) {
      return this.setState({isLoading: false})
    }

    getSource(params.id)
      .then(({data: source}) => {
        this.setState({
          source: {...DEFAULT_SOURCE, ...source},
          isLoading: false,
        })
      })
      .catch(error => {
        notify(NOTIFY_ERROR_CONNECTING_TO_SOURCE(this._parseError(error)))
        this.setState({isLoading: false})
      })
  }

  handleInputChange = e => {
    let val = e.target.value
    const name = e.target.name

    if (e.target.type === 'checkbox') {
      val = e.target.checked
    }

    this.setState(prevState => {
      const source = {
        ...prevState.source,
        [name]: val,
      }

      return {...prevState, source}
    })
  }

  handleBlurSourceURL = () => {
    const {source, editMode} = this.state
    if (editMode) {
      this.setState(this._normalizeSource)
      return
    }

    if (!source.url) {
      return
    }

    this.setState(this._normalizeSource, this._createSourceOnBlur)
  }

  handleSubmit = e => {
    e.preventDefault()
    const {isCreated, editMode} = this.state
    const isNewSource = !editMode

    if (!isCreated && isNewSource) {
      return this.setState(this._normalizeSource, this._createSource)
    }

    this.setState(this._normalizeSource, this._updateSource)
  }

  gotoPurgatory = () => {
    const {router} = this.props
    router.push('/purgatory')
  }

  _normalizeSource({source}) {
    const url = source.url.trim()
    if (source.url.startsWith('http')) {
      return {source: {...source, url}}
    }
    return {source: {...source, url: `http://${url}`}}
  }

  _createSourceOnBlur = () => {
    const {source} = this.state
    // if there is a type on source it has already been created
    if (source.type) {
      return
    }
    createSource(source)
      .then(({data: sourceFromServer}) => {
        this.props.addSource(sourceFromServer)
        this.setState({
          source: {...DEFAULT_SOURCE, ...sourceFromServer},
          isCreated: true,
        })
      })
      .catch(err => {
        // dont want to flash this until they submit
        const error = this._parseError(err)
        console.error('Error creating InfluxDB connection: ', error)
      })
  }

  _createSource = () => {
    const {source} = this.state
    const {notify} = this.props
    createSource(source)
      .then(({data: sourceFromServer}) => {
        this.props.addSource(sourceFromServer)
        this._redirect(sourceFromServer)
        notify(NOTIFY_SOURCE_CREATION_SUCCEEDED(source.name))
      })
      .catch(error => {
        notify(
          NOTIFY_SOURCE_CREATION_FAILED(source.name, this._parseError(error))
        )
      })
  }

  _updateSource = () => {
    const {source} = this.state
    const {notify} = this.props
    updateSource(source)
      .then(({data: sourceFromServer}) => {
        this.props.updateSource(sourceFromServer)
        this._redirect(sourceFromServer)
        notify(NOTIFY_SOURCE_UPDATED(source.name))
      })
      .catch(error => {
        notify(
          NOTIFY_SOURCE_UPDATE_FAILED(source.name, this._parseError(error))
        )
      })
  }

  _redirect = source => {
    const {isInitialSource} = this.state
    const {params, router} = this.props

    if (isInitialSource) {
      return this._redirectToApp(source)
    }

    router.push(`/sources/${params.sourceID}/manage-sources`)
  }

  _redirectToApp = source => {
    const {location, router} = this.props
    const {redirectPath} = location.query

    if (!redirectPath) {
      return router.push(`/sources/${source.id}/hosts`)
    }

    const fixedPath = redirectPath.replace(
      /\/sources\/[^/]*/,
      `/sources/${source.id}`
    )
    return router.push(fixedPath)
  }

  _parseError = error => {
    return _.get(error, ['data', 'message'], error)
  }

  render() {
    const {isLoading, source, editMode, isInitialSource} = this.state

    if (isLoading) {
      return <div className="page-spinner" />
    }

    return (
      <div className={`${isInitialSource ? '' : 'page'}`}>
        <Notifications />
        <div className="page-header">
          <div className="page-header__container page-header__source-page">
            <div className="page-header__col-md-8">
              <div className="page-header__left">
                <h1 className="page-header__title">
                  {editMode
                    ? 'Configure InfluxDB Connection'
                    : 'Add a New InfluxDB Connection'}
                </h1>
              </div>
              {isInitialSource ? null : (
                <div className="page-header__right">
                  <SourceIndicator />
                </div>
              )}
            </div>
          </div>
        </div>
        <FancyScrollbar className="page-contents">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-8 col-md-offset-2">
                <div className="panel">
                  <SourceForm
                    source={source}
                    editMode={editMode}
                    onInputChange={this.handleInputChange}
                    onSubmit={this.handleSubmit}
                    onBlurSourceURL={this.handleBlurSourceURL}
                    isInitialSource={isInitialSource}
                    gotoPurgatory={this.gotoPurgatory}
                  />
                </div>
              </div>
            </div>
          </div>
        </FancyScrollbar>
      </div>
    )
  }
}

const {func, shape, string} = PropTypes

SourcePage.propTypes = {
  params: shape({
    id: string,
    sourceID: string,
  }),
  router: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    query: shape({
      redirectPath: string,
    }).isRequired,
  }).isRequired,
  notify: func.isRequired,
  addSource: func.isRequired,
  updateSource: func.isRequired,
}

const mapDispatchToProps = dispatch => ({
  notify: bindActionCreators(notifyAction, dispatch),
  addSource: bindActionCreators(addSourceAction, dispatch),
  updateSource: bindActionCreators(updateSourceAction, dispatch),
})
export default connect(null, mapDispatchToProps)(withRouter(SourcePage))
