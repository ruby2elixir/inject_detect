import Charges from './Charges';
import OneTimePurchase from './OneTimePurchase';
import OneTimePurchaseModal from './OneTimePurchaseModal';
import React from 'react';
import RecurringPurchase from './RecurringPurchase';
import _ from 'lodash';
import gql from 'graphql-tag';
import { Button, Form } from 'semantic-ui-react';
import { commas } from './pretty';
import { graphql } from 'react-apollo';

class Account extends React.Component {
    state = {
        oneTimePurchase: true
    };

    style = {
        base: {
            fontFamily: "Lato,'Helvetica Neue',Arial,Helvetica,sans-serif",
            '::placeholder': {
                color: '#ccc'
            }
        }
    };

    initStripeElements() {
        const stripe = window.Stripe(_.get(process.env, 'REACT_APP_STRIPE_SECRET'));
        const elements = stripe.elements();
        const card = elements.create('card', { style: this.style });
        card.mount('#card-element');
        this.stripe = stripe;
        this.elements = elements;
        this.card = card;
    }

    initProgress() {
        window.$('.ui.progress').progress();
    }

    componentDidMount() {
        this.initProgress();
    }

    componentDidUpdate() {
        this.initProgress();
    }

    componentWillUpdate() {
        if (!this.props.data.loading) {
            this.initStripeElements();
        }
    }

    setOneTimePurchase = oneTimePurchase => {
        return e => {
            this.setState({ oneTimePurchase });
        };
    };

    render() {
        let { loading, user } = this.props.data;
        let { oneTimePurchase } = this.state;

        if (loading) {
            return <div className="ui active loader" />;
        }

        console.log(user);

        return (
            <div className="ij-dashboard ui stackable grid">
                <div className="sixteen wide column">
                    <h1 className="ui header">
                        Account settings
                    </h1>
                </div>

                <div className="sixteen wide column section" style={{ marginTop: 0 }}>
                    {/* <h3 className="ui sub header">Credits and Payments:</h3> */}
                    <p className="instructions">
                        <span>
                            Your account current has <strong>{commas(user.credits)}</strong> credits remaining.{' '}
                        </span>
                        {user.refill
                            ? <span>
                                  Your account is configured to automatically purchase an additional
                                  {' '}
                                  <strong>{commas(user.refillAmount)}</strong>
                                  {' '}
                                  credits once it reaches
                                  {' '}
                                  <strong>{commas(user.refillTrigger)}</strong>
                                  {' '}
                                  remaining credits using a card ending in <strong>{user.stripeToken.last4}</strong>.
                                  {' '}
                              </span>
                            : <span>
                                  <strong>
                                      Your account is not configured to automatically purchase additional credits.{' '}
                                  </strong>
                              </span>}
                    </p>
                    <div
                        className="ui indicating progress"
                        data-percent={Math.min(user.credits / user.refillAmount, 1) * 100}
                    >
                        <div className="bar" />
                    </div>
                </div>

                <hr style={{ border: 0, borderBottom: '1px solid #ddd', width: '75%', margin: '1em auto 2em' }} />

                <div className="sixteen wide column" style={{ marginTop: 0 }}>
                    <div className="ui grid">
                        <div
                            className="sixteen wide column section"
                            style={{ marginTop: 0, marginLeft: 'auto', marginRight: 'auto' }}
                        >
                            <OneTimePurchaseModal user={user} />
                        </div>

                        <div
                            className="sixteen wide column section"
                            style={{ marginTop: 0, marginLeft: 'auto', marginRight: 'auto' }}
                        >
                            <Button
                                primary
                                fluid
                                icon="repeat"
                                size="big"
                                content="Configure automatic refills"
                                labelPosition="right"
                            />
                        </div>

                        <div
                            className="sixteen wide column section"
                            style={{ marginTop: 0, marginLeft: 'auto', marginRight: 'auto' }}
                        >
                            <Button
                                className="brand"
                                fluid
                                icon="remove"
                                size="big"
                                content="Turn off automatic refills"
                                labelPosition="right"
                            />
                        </div>
                    </div>
                </div>

                {/* {user.stripeToken
                        ? <p className="instructions">Credit card on file: {user.stripeToken.last4}</p>
                        : null}

                        <div className="ui segment">
                        <Form>
                        <Form.Radio
                        label="Recurring purchase"
                        onChange={this.setOneTimePurchase(false)}
                        checked={!oneTimePurchase}
                        />
                        <Form.Radio
                        label="One time purchase"
                        onChange={this.setOneTimePurchase(true)}
                        checked={oneTimePurchase}
                        />
                        {oneTimePurchase ? <OneTimePurchase user={user} /> : <RecurringPurchase user={user} />}
                        </Form>
                        </div> */}

            </div>
        );
    }
}

export default graphql(gql`
    query {
        user {
            id
            credits
            refill
            refillTrigger
            refillAmount
            email
            stripeToken {
                card {
                    last4
                }
            }
        }
    }
`)(Account);
