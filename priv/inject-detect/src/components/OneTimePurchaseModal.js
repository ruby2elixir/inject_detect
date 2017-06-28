import ConfirmModal from './ConfirmModal';
import SuccessModal from './SuccessModal';
import React from 'react';
import _ from 'lodash';
import gql from 'graphql-tag';
import { Button, Form, Modal } from 'semantic-ui-react';
import { Redirect } from 'react-router-dom';
import { graphql } from 'react-apollo';

class OneTimePurchaseModal extends React.Component {
    state = {
        open: false,
        loading: false,
        success: false,
        credits: undefined,
        creditPrice: undefined
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

    componentDidUpdate(prevProps, prevState) {
        if (!prevState.open && this.state.open) {
            this.initStripeElements();
        }
    }

    open = () => this.setState({ open: true, credits: undefined });
    close = () => this.setState({ open: false });

    oneTimePurchase = () => {
        this.setState({ errors: false, success: false, loading: true });

        let userId = this.props.user.id;
        let credits = this.state.credits;

        this.stripe
            .createToken(this.card)
            .then(result => {
                if (result.error) {
                    throw { graphQLErrors: [{ error: result.error.message }] };
                } else {
                    return result.token;
                }
            })
            .then(stripeToken => ({
                id: stripeToken.id,
                card: {
                    id: _.get(stripeToken, 'card.id'),
                    expMonth: _.get(stripeToken, 'card.exp_month'),
                    expYear: _.get(stripeToken, 'card.exp_year'),
                    last4: _.get(stripeToken, 'card.last4')
                }
            }))
            .then(stripeToken => this.props.oneTimePurchase(userId, credits, stripeToken))
            .then(res => {
                this.setState({
                    success: true,
                    open: false
                });
            })
            .catch(error => {
                let errors = _.isEmpty(error.graphQLErrors) ? [{ error: 'Unexpected error' }] : error.graphQLErrors;
                this.setState({ errors });
            })
            .then(() => {
                this.setState({ loading: false });
            });
    };

    changeCredits = (e, select) => {
        this.setState({
            credits: select.value,
            creditPrice: _.find(select.options, o => o.value == select.value).text
        });
    };

    render() {
        const { user } = this.props;
        const { credits, creditPrice, errors, loading, open, success, applicationId } = this.state;

        if (applicationId) {
            return <Redirect to={`/application/${applicationId}`} />;
        }

        if (success) {
            return (
                <SuccessModal
                    header="Credits Purchased!"
                    text={`Your purchase was successful! We've gone ahead and added those ${Number(credits).toLocaleString()} to your account.`}
                    positive="Return to account"
                    callback={() => this.setState({ success: false })}
                />
            );
        }

        return (
            <Modal
                size="small"
                className="one-time-purchase-modal"
                closeIcon="close"
                trigger={
                    <Button
                        primary
                        fluid
                        icon="dollar"
                        size="big"
                        content="One time credit purchase"
                        labelPosition="right"
                    />
                }
                open={open}
                onOpen={this.open}
                onClose={this.close}
            >
                <Modal.Header>One time credit purchase</Modal.Header>
                <div className="content">
                    <form className="ui large form">
                        <div>
                            <p className="instructions">
                                Select the number of credits you want to buy along with your payment information. Your purchased credits will immediately be available to your account.
                            </p>
                            <Form.Select
                                label="Credits to purchase:"
                                value={credits}
                                onChange={this.changeCredits}
                                options={[
                                    { key: 100000, text: '100,000 credits for $10.00', value: 100000 },
                                    { key: 200000, text: '200,000 credits for $20.00', value: 200000 },
                                    { key: 500000, text: '500,000 credits for $50.00', value: 500000 },
                                    { key: 1000000, text: '1,000,000 credits for $100.00', value: 1000000 },
                                    { key: 10000000, text: '10,000,000 credits for $1000.00', value: 10000000 }
                                ]}
                                placeholder="Credits to purchase"
                            />
                            <div className="field">
                                <label>Payment information:</label>
                                <div
                                    id="card-element"
                                    style={{
                                        border: '1px solid rgba(34,36,38,.15)',
                                        borderRadius: '.28571429rem',
                                        padding: '.67857143em 1em'
                                    }}
                                />
                            </div>
                        </div>

                        {errors &&
                            errors.map(({ error }) => <div key={error} className="ui error message">{error}</div>)}

                    </form>

                </div>
                <div className="actions">
                    <Button onClick={this.close} disabled={loading}>
                        Cancel
                    </Button>
                    <ConfirmModal
                        header="Purchase credits?"
                        text={`Are you sure you want to make a one time purchase of ${creditPrice}`}
                        positive="Purchase credits"
                        callback={this.oneTimePurchase}
                        trigger={
                            <Button
                                positive
                                loading={loading}
                                icon="dollar"
                                labelPosition="right"
                                content="Purchase credits"
                            />
                        }
                    />
                </div>
            </Modal>
        );
    }
}

export default graphql(
    gql`
    mutation oneTimePurchase ($userId: String!,
                              $credits: String!,
                              $stripeToken: StripeTokenInput!) {
        oneTimePurchase(userId: $userId,
                        credits: $credits,
                        stripeToken: $stripeToken) {
            id
            credits
        }
    }
`,
    {
        props: ({ mutate }) => ({
            oneTimePurchase: (userId, credits, stripeToken) =>
                mutate({
                    variables: { userId, credits, stripeToken }
                })
        })
    }
)(OneTimePurchaseModal);