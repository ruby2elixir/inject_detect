defmodule InjectDetect.Event.IngestedUnexpectedQueries do
  defstruct application_token: nil,
            queries: []

  def convert_from(event, _), do: struct(__MODULE__, event)

end

defimpl InjectDetect.State.Reducer,
   for: InjectDetect.Event.IngestedUnexpectedQueries do

  def apply(event = %{queries: queries}, state) do
    queries
    |> Enum.map(&tokenize/1)
    |> Enum.reduce(state, &apply_query(event, &1, &2))
  end

  def tokenize(query), do:
    for {k, v} <- query, into: %{}, do: {String.to_atom(k), v}

  def apply_query(event, query, state) do
    key = %{collection: query.collection, type: query.type, query: query.query}
    update_in(state, [:unexpected_queries,
                      key], &add_or_update_query(&1, query))
    update_in(state, [:applications,
                      event.application_token,
                      :unexpected_queries], &add_to_application(&1, key))
  end

  def add_or_update_query(nil, query) do
    %{collection: query.collection,
      count: 1,
      query: query.query,
      type: query.type,
      last_queried_at: query.queried_at}
  end

  def add_or_update_query(query, %{queried_at: queried_at}) do
    %{query | count: query.count + 1,
      last_queried_at: queried_at}
  end

  def add_to_application([], key), do:
    [key]
  def add_to_application([key | queries], key), do:
    [key | queries]
  def add_to_application([head | queries], key), do:
    [head | add_to_application(queries, key)]

end