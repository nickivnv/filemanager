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
    this.loadPlotlyCDN();
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
    this.setState({ plotlyData_sel: nbr});
  }

  handleBack = async () => {
    let nbr = this.state.plotlyData_sel - 1;
    if ( nbr < 0)
    {
      nbr = this.state.plotlyData.length - 1;
    }
    this.setState({ plotlyData_sel: nbr});
  }

  loadPlotlyCDN = () => {
    const existingScript = document.getElementById('plotly');  
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-basic-3.0.1.min.js';
      script.id = 'plotly';
      script.async = false;
      document.body.appendChild(script);
    }
  }

  loadPlot = (nbr) => {
    this.loadPlotlyCDN();
    try{
      Plotly.react( 
        "plot", // PLot Figure ID
        this.state.plotlyData[nbr]["data"], // Plot figure Data
        this.state.plotlyData[nbr]["layout"], // Plot figure layout
        {responsive: true}
      );  
    }
    catch(e)
    {      
      console.log("no Data available!"); // ToDo: This should get shown on Dialog
    }
  }

  render() {
    const { onHide, headerText } = this.props;
    return (
      <Dialog className="oc-fm-plotly-dialog" onHide={this.handleClose}>
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

          <div id="plot" className="oc-fm-plotly-dialog-plot"/>      

          {this.loadPlot(this.state.plotlyData_sel)}      

        </div>
      </Dialog>
    );
  }
}

PlotlyDialog.propTypes = propTypes;
PlotlyDialog.defaultProps = defaultProps;
