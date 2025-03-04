import PropTypes from 'prop-types';
import React, { Component } from 'react';
import './PlotlyDialog.less';
import Dialog from '../Dialog';
import Svg from '@opuscapita/react-svg/lib/SVG';
import icons from './icons-svg';

const propTypes = {
  readOnly: PropTypes.bool,
  headerText: PropTypes.string,
  fileName: PropTypes.string,
  onChange: PropTypes.func,
  onHide: PropTypes.func,
  onSubmit: PropTypes.func,
  onValidate: PropTypes.func,
  getFileContent: PropTypes.func
};
const defaultProps = { 
  readOnly: false,
  headerText: '',
  fileName: '',
  onChange: () => {},
  onHide: () => {},
  onSubmit: () => {},
  onValidate: () => {},
  getFileContent: () => {}
};

export default
class PlotlyDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      plotlyData_sel: 0,
      plotlyData: {}
    };
  }

  componentDidMount() {
    this._isMounted = true
    this.initPlotlyData();
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  initPlotlyData = async (e) => {
    let value = await this.props.getFileContent(); 
    value = value.replaceAll("'", '"').split("/*$plotlyData$*/"); // change all ' to ", needed for the json parse and split them with the keyword to extract the data
    let valueArray = [];
    for (let i=1; i < value.length; i=i+2) // get data for all plots of the html file
    {
      try{
        valueArray.push(JSON.parse(value[i]));
      }catch(err){}
    }    
    this.setState({ plotlyData: valueArray, plotlyData_sel: 0});
    Plotly.react( 
      "plot",
      valueArray[0]["data"],
      valueArray[0]["layout"]
    );
  } 

  handleClose = async () => {
    this.handleSkipSaveAndClose();
  }

  handleSkipSaveAndClose = async () => {
      this.props.onHide();
      this.newText = null;
  }

  handleNext = async () => {
    let nbr = this.state.plotlyData_sel + 1;
    if ( nbr >= this.state.plotlyData.length)
    {
      nbr = 0;
    }
    Plotly.react( 
      "plot",
      this.state.plotlyData[nbr]["data"],
      this.state.plotlyData[nbr]["layout"]
    );
    this.setState({ plotlyData_sel: nbr});
  }

  handleBack = async () => {
    let nbr = this.state.plotlyData_sel - 1;
    if ( nbr < 0)
    {
      nbr = this.state.plotlyData.length - 1;
    }
    Plotly.react( 
      "plot",
      this.state.plotlyData[nbr]["data"],
      this.state.plotlyData[nbr]["layout"]
    );
    this.setState({ plotlyData_sel: nbr});
  }

  render() {
    const { onHide, headerText } = this.props;
    if (this.state.plotlyData.length != undefined) // toDo: the async read of the plotly data lead to a first plot with undefined data -> the ploting should wait till data ist processed
    {
      try{
        return (
          <Dialog className="oc-fm-plotly-dialog" onHide={this.handleClose} >
            <div className="oc-plotly--dialog__content" >
                
              <Svg
                className="oc-plotly--dialog__close-icon"
                svg={icons.close}
                onClick={this.handleClose}
              />                                   
              
              {this.state.plotlyData.length>1 ? (
                <Svg
                  className="oc-plotly--dialog__next-icon"
                  svg={icons.next}
                  onClick={this.handleNext}
                />   
              ) : null}                            
            
              {this.state.plotlyData.length>1 ? (
                <Svg
                  className="oc-plotly--dialog__back-icon"
                  svg={icons.back}
                  onClick={this.handleBack}
                />        
              ) : null} 

              <div className="oc-fm--dialog__header">
                {headerText}
              </div>

              <figure id="plot" className="oc-fm-plotly-dialog-plot"/>

            </div>
          </Dialog>
        );
      }
      catch(e){
        return (
          <Dialog className="oc-fm-plotly-dialog" onHide={this.handleClose}>
            <div className="oc-plotly--dialog__content">
               
              <Svg
                className="oc-plotly--dialog__close-icon"
                svg={icons.close}
                onClick={this.handleClose}
              />                
            
            </div>
          </Dialog>
        );
      }
    }    
    else
    {
      return (
        <Dialog className="oc-fm-plotly-dialog" onHide={this.handleClose}>
          <div className="oc-plotly--dialog__content">
             
            <Svg
              className="oc-plotly--dialog__close-icon"
              svg={icons.close}
              onClick={this.handleClose}
            />                
            
          </div>
        </Dialog>
      );
    }
  }
}

PlotlyDialog.propTypes = propTypes;
PlotlyDialog.defaultProps = defaultProps;
