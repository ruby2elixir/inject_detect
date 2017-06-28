defmodule InjectDetect.Command.Unsubscribe do
  defstruct user_id: nil
end

defimpl InjectDetect.Command, for: InjectDetect.Command.Unsubscribe do

  alias InjectDetect.Event.Unsubscribed
  alias InjectDetect.State.User

  def unsubscribe(user = %{id: user_id}, command, %{user_id: user_id}) do
    {:ok, [%Unsubscribed{user_id: user_id}]}
  end

  def unsubscribe(_, _, _) do
    {:error, %{code: :not_authorized,
               error: "Not authorized",
               message: "Not authorized"}}
  end

  def handle(command, context) do
    User.find(command.user_id)
    |> unsubscribe(command, context)
  end

end