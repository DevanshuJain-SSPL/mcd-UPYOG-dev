import { DropDown, Icon, Image, List } from "components";
import { getTransformedLocale, getLocaleLabels } from "egov-ui-framework/ui-utils/commons";
import emptyFace from "egov-ui-kit/assets/images/download.png";
import { getLocale, getTenantId, setTenantId, getUserInfo, setStoredModulesList, setModule } from "egov-ui-kit/utils/localStorageUtils";
import React, { Component } from "react";
import LogoutDialog from "../LogoutDialog";
import { getQueryArg } from "egov-ui-kit/utils/commons";
import { CommonMenuItems } from "../NavigationDrawer/commonMenuItems";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import { connect } from "react-redux";
import get from "lodash/get";
import { setRoute, setLocalizationLabels } from "egov-ui-kit/redux/app/actions";

import "./index.css";

class UserSettings extends Component {
  state = {
    languageSelected: getLocale(),
    displayAccInfo: false,
    tenantSelected: getTenantId(),
    tempTenantSelected: getTenantId(),
    open: false,
    roleSelected: "",
    
  };
  style = {
    baseStyle: {
      background: "#ffffff",
      height: "65px",
      marginRight: "30px",
      width: "98px",
      marginBottom: "24px",
    },
    label: {
      color: "#5F5C57",
      fontSize: "12px",
      paddingRight: "0px",
    },
    arrowIconStyle: {
      marginTop: "7px",
      marginLeft: "10px",
    },
    iconStyle: {
      marginRight: "30px",
    },
    listStyle: {
      display: "block",
    },
    listInnerDivStyle: {
      padding: "10px",
      display: "flex",
      alignItems: "center",
    },
    baseTenantStyle: {
      background: "#ffffff",
      height: "65px",
      marginRight: "30px",
      width: "102px",
      marginBottom: "24px",
    },
    roleDropDownStyle: {
      background: "#ffffff",
      height: "65px",
      marginRight: "30px",
      width: "200px",
      marginBottom: "24px",
    },

  };

  onChange = (event, index, value) => {
    this.setState({ ...this.state, languageSelected: value });
    this.props.fetchLocalizationLabel(value);
  };

  handleTenantChange = () => {
    let tenantSelected = this.state.tempTenantSelected;
    this.setState({ ...this.state, tenantSelected: tenantSelected });
    setTenantId(tenantSelected);
    this.props.setRoute("/");
  };

  onTenantChange = (event, index, value) => {
    if (location.pathname.includes("/inbox")) {
      this.setState({ ...this.state, tenantSelected: value });
      setTenantId(value);
      this.props.setRoute("/");
    } else {
      this.setState({ ...this.state, open: true, tempTenantSelected: value });
    }
  };

  
  handleClose = () => {
    this.setState({ ...this.state, open: false });
  };
  onLanguageChange = (event, index, value) => {
    //const {setRote} = this.props;
    this.setState({ languageSelected: value });
    let tenantId = getTenantId();

    if (process.env.REACT_APP_NAME === "Citizen") {
      const tenantInfo=getQueryArg(window.location.href, "tenantId")
      const userInfo = JSON.parse(getUserInfo());
      tenantId = userInfo && userInfo.permanentCity;
      tenantId = tenantInfo?tenantInfo:tenantId;
    }
    var resetList=[];
    var newList =JSON.stringify(resetList);
    setStoredModulesList(newList);
    let locale= getLocale();
    let resultArray=[];
    setLocalizationLabels(locale, resultArray);
    this.props.fetchLocalizationLabel(value, tenantId, tenantId);
  };

  // onUserChange = (event, index, value) => {
  //   const { setRoute } = this.props;


  //   setRoute(value);
  // }

  toggleAccInfo() {
    this.setState({
      displayAccInfo: !this.state.displayAccInfo,
    });
  }

  handleClose = event => {
    // if (this.anchorEl.contains(event.target)) {
    //   return;
    // }
    this.setState({ displayAccInfo: false });
  };

  render() {
    const { languageSelected, displayAccInfo, tenantSelected, open } = this.state;
    const { style } = this;
    const { onIconClick, userInfo, handleItemClick, hasLocalisation, languages, fetchLocalizationLabel, isUserSetting } = this.props;

    // This is TTL ===========
    const { sessionTTL } = this.props;
    const safeTTL = sessionTTL || 0;

    // convert into mm:ss
    const minutes = Math.floor(safeTTL / 60);
    const seconds = safeTTL % 60;

    // pad numbers (e.g., 09:04)
    const pad = (num) => String(num).padStart(2, "0");
    const formattedTTL = `${pad(minutes)}:${pad(seconds)}`;


    /**
     * Get All tenant id's from (user info -> roles) to populate dropdown
     */
    let tenantIdsList = get(userInfo, "roles", []).map((role) => {
      return role.tenantId;
    });
    tenantIdsList = [...new Set(tenantIdsList)];
    tenantIdsList = tenantIdsList.map((tenantId) => {
      return { value: tenantId, label: getLocaleLabels(tenantId, "TENANT_TENANTS_" + getTransformedLocale(tenantId)) };
    });

    let userRoleList = [
      { value: "", label: "Assigned Roles" },
      ...get(userInfo, "roles", [])
        .map((role) => role.name)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map((roleCode) => ({
          value: roleCode,
          label: roleCode,
        }))
    ];

    return (
      <div className="userSettingsContainer">
        {isUserSetting && <LogoutDialog
          logoutPopupOpen={open}
          closeLogoutDialog={this.handleClose}
          logout={this.handleTenantChange}
          oktext={"CORE_CHANGE_TENANT_OK"}
          canceltext={"CORE_CHANGE_TENANT_CANCEL"}
          title={"CORE_CHANGE_TENANT"}
          body={"CORE_CHANGE_TENANT_DESCRIPTION"}
        />}
        {/* {process.env.REACT_APP_NAME === "Employee" && isUserSetting && (
          <DropDown
            onChange={this.onTenantChange}
            listStyle={style.listStyle}
            style={style.baseTenantStyle}
            labelStyle={style.label}
            dropDownData={tenantIdsList}
            value={tenantSelected}
            underlineStyle={{ borderBottom: "none" }}
          />
        )} */}
        {process.env.REACT_APP_NAME === "Employee" && isUserSetting && (
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginRight: "20px" }}>
            
            {/* Role Dropdown */}
            <DropDown
              onChange={(event, index, value) => {
                this.setState({ roleSelected: value });
              }}
              listStyle={style.listStyle}
              style={style.roleDropDownStyle}
              labelStyle={style.label}
              dropDownData={userRoleList}
              value={this.state.roleSelected}
              underlineStyle={{ borderBottom: "none" }}
            />

            {/* Language Dropdown */}
            {hasLocalisation && (
              <DropDown
                onChange={this.onLanguageChange}
                listStyle={style.listStyle}
                style={style.baseStyle}
                labelStyle={style.label}
                dropDownData={languages}
                value={languageSelected}
                underlineStyle={{ borderBottom: "none" }}
              />
            )}

            {/* TTL Timer */}
            {sessionTTL !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "60px",
                paddingRight: "20px",
                fontFamily: "'Inter', 'Roboto', sans-serif",
                fontWeight: "600",
                fontSize: "14px",
                color: "#475569",
                letterSpacing: "0.3px",
              }}
            >
              <span style={{ marginRight: "10px", opacity: 0.8 }}>Session Expires In:</span>
              <span
                style={{
                  backgroundColor:
                    safeTTL < 60
                      ? "rgba(255, 77, 79, 0.15)" // light red
                      : safeTTL < 180
                      ? "rgba(234, 179, 8, 0.15)" // light yellow
                      : "rgba(22, 163, 74, 0.15)", // light green
                  color:
                    safeTTL < 60
                      ? "#ff4d4f" // red text
                      : safeTTL < 180
                      ? "#b45309" // amber text
                      : "#15803d", // green text
                  fontSize: "15px",
                  fontWeight: "700",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  transition: "all 0.4s ease",
                  minWidth: "75px",
                  textAlign: "center",
                  display: "inline-block",
                }}
              >
                {formattedTTL}
              </span>
            </div>
          )}

          {/* End of TTL Timer */}


          </div>
        )}


        {/* 
        <div>
          <Image width={"33px"} circular={true} source={userInfo.photo || emptyFace} />
          <DropDown
            onChange={this.onUserChange}
            listStyle={style.listStyle}
            style={style.baseStyle}
            labelStyle={style.label}
            dropDownData={CommonMenuItems}
            value={displayAccInfo}
            underlineStyle={{ borderBottom: "none" }}
          />
        </div> */}

        {/* <Icon action="social" name="notifications" color="#767676" style={style.iconStyle} /> */}
        <ClickAwayListener onClickAway={this.handleClose}>
          {isUserSetting && <div
            onClick={() => {
              this.toggleAccInfo();
            }}
            className="userSettingsInnerContainer"
          >
            <Image width={"33px"} circular={true} source={userInfo.photo || emptyFace} />
            <Icon action="navigation" name="arrow-drop-down" color="#767676" style={style.arrowIconStyle} />

            <div className="user-acc-info">
              {displayAccInfo ? (
                <List
                  opem
                  onItemClick={(item) => {
                    handleItemClick(item, false);
                  }}
                  innerDivStyle={style.listInnerDivStyle}
                  className="drawer-list-style"
                  items={CommonMenuItems}
                  listContainerStyle={{ background: "#ffffff" }}
                  listItemStyle={{ borderBottom: "1px solid #e0e0e0" }}
                />
              ) : (
                  ""
                )}
            </div>
          </div>}
        </ClickAwayListener>
      </div>
    );
  }
}

const mapStateToProps = ({ app, common }) => {
  const { locale, sessionTTL } = app;
  const { stateInfoById } = common;
  let languages = get(stateInfoById, "0.languages", []);
  return { languages, locale, sessionTTL };
};


const mapDispatchToProps = (dispatch) => {
  return {
    setRoute: (route) => dispatch(setRoute(route)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserSettings);