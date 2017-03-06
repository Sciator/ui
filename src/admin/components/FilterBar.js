import React, {Component, PropTypes} from 'react'

class FilterBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filterText: '',
    }

    this.handleText = ::this.handleText
  }

  handleText(e) {
    this.setState(
      {filterText: e.target.value},
      this.props.onFilter(e.target.value)
    )
  }

  render() {
    return (
      <div className="panel-heading u-flex u-ai-center u-jc-space-between">
        <div className="users__search-widget input-group admin__search-widget">
          <input
            type="text"
            className="form-control"
            placeholder={`Filter ${name}...`}
            value={this.state.filterText}
            onChange={this.handleText}
          />
          <div className="input-group-addon">
            <span className="icon search" aria-hidden="true"></span>
          </div>
        </div>
        <a href="#" className="btn btn-primary">Create {name}</a>
      </div>
    )
  }
}

const {
  func,
  string,
} = PropTypes

FilterBar.propTypes = {
  onFilter: func.isRequired,
  name: string,
}

export default FilterBar
