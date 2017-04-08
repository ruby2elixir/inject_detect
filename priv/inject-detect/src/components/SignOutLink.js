import React from "react";
import _ from "lodash";
import gql from "graphql-tag";
import { graphql } from "react-apollo";

class SignOutLink extends React.Component {

    signOut(e) {
        e.preventDefault();
        this.props.signOut()
            .then(() => {
                localStorage.removeItem("authToken");
            });
    }

    render() {
        return (
            <a href="#" className="item" onClick={this.signOut.bind(this)}>{this.props.children}</a>
        );
    }
};

SignOutLink.propTypes = {
    signOut: React.PropTypes.func.isRequired
};

export default graphql(gql`
    mutation signOut {
        signOut {
            id
        }
    }
`, {
    name: "signOut"
})(SignOutLink);